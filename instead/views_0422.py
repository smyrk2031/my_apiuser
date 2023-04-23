from django.shortcuts import render
from django.http import JsonResponse
from django.http import HttpResponse
from django.views import View
#import speech_recognition as sr
from io import BytesIO

# RestAPIのリクエスト用
import requests

# 画像
from PIL import Image
import base64

# 文字変換
import io
import json
import os
import subprocess
import tempfile
import wave
import struct
import numpy as np
import scipy.io.wavfile as wav

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

import torch
print("=== "*14)
print(torch.cuda.get_device_name(0))
import whisper

#model = whisper.load_model("tiny")
model = whisper.load_model("base")
#model = whisper.load_model("small")

# Create your views here.
def index(requests):
    return render(requests, 'test13.html')


def clip_org(requests):
    print("◆func: clip_org はじまる")
    #return render(requests, 'clip_org.html')
    return render(requests, 'clip_org2.html')

# RestAPI_CLIPの実行
def api_run_clip(base64_image_data, list_txt, list_txt_bin):
    from urllib.parse import urlencode
    import urllib.request
    import http.client
    """
    base64_image_data: リクエストの画像入力 base64.b64encode(image).decode('utf-8') で、リサイズ後の画像データ
    list_txt: リクエストのテキスト入力　リスト型 ["cat", "dog", "","",""]
    list_txt_bin: リクエストのテキスト入力のblankを除去する為のマスクリスト [1,1,0,0,0]
    result: リスト型式でテキスト毎の推論結果を出力する [0.2, 0.2, 0.2, 0.2, 0.2]
    """
    # RestAPIにリクエストを送る
    url = '127.0.0.1:8000'
    headers = {'Content-Type': 'application/json'}
    data = {'img': base64_image_data, 'list_txt':list_txt, 'list_txt_bin':list_txt_bin}
    json_data = json.dumps(data)

    conn = http.client.HTTPConnection(url)
    conn.request(method='POST', url='/myapi/openaiCLIP/', body=json_data, headers=headers)
    response = conn.getresponse()
    body = response.read().decode('utf-8')
    conn.close()

    print("◆- "*20)
    response_data = json.loads(body)
    print(type(response_data))
    print(response_data)

    # 出力はこんなんなので、文字と類似度で構成された辞書に変換する
    # {'clip_text': ['human : 0.2109', 'animal : 0.3818', 'material : 0.01843', 'scenery : 0.006992', 'animal : 0.3818']}
    response_data_dict = {}
    for item in response_data['clip_text']:
        key, value = item.split(':')
        response_data_dict[key.strip()] = float(value.strip())

    print(response_data_dict)

    # result：入力テキストで空白だった部分の推論結果として「0」を代入する
    result = []
    for i in list_txt:
        try:
            result.append(response_data_dict[i])
        except:
            result.append(0)
    return result

# CLIP実行時に、入力画像サイズをリサイズしたい
def resize_image(image_data, set_maxlong=1200):
    """
    set_maxlong: 画像リサイズで長辺の長さを指定している
    """
    with io.BytesIO(base64.b64decode(image_data)) as f:
        with Image.open(f) as img:
            # 画像の縦横サイズを取得する
            width, height = img.size
            if width > height and width > set_maxlong:
                # 幅が長い場合、幅をset_maxlongにリサイズして、アスペクト比を保つ
                new_width = set_maxlong
                new_height = round(height * (new_width / width))
            elif height > width and height > set_maxlong:
                # 高さが長い場合、高さをset_maxlongにリサイズして、アスペクト比を保つ
                new_height = set_maxlong
                new_width = round(width * (new_height / height))
            else:
                # 画像のサイズがset_maxlong以下の場合は、リサイズしない
                new_width = width
                new_height = height
            
            # RGBAモードをRGBモードに変換
            img = img.convert('RGB')
            
            # リサイズ
            resized_img = img.resize((new_width, new_height))
            
            # 保存用のバッファを用意
            output_buffer = io.BytesIO()
            
            # JPEG形式で保存
            resized_img.save(output_buffer, format='JPEG')
            
            # base64でエンコードして返す
            return base64.b64encode(output_buffer.getvalue()).decode('utf-8')

@csrf_exempt
def clip_org_bg(requests):
    from urllib.parse import urlencode
    import urllib.request
    import http.client

    # Ajaxで画像取得→API→返値をブラウザに反映
    print("◆func: clip_org_bg はじまる")
    list_txt = [requests.POST.get("txt1"),
                requests.POST.get("txt2"),
                requests.POST.get("txt3"),
                requests.POST.get("txt4"),
                requests.POST.get("txt5")]
    print(list_txt)
    
    # 空白は類似度が高くなりがちなので、空白がある場合は除外したい。
    list_txt_bin = [x if list_txt[x] == True else None for x in range(len(list_txt))]

    print(requests.GET)
    print(requests.POST)
    print("リクエストのFILESを確認")
    print(requests.FILES.get('upload_image1', None))

    # 画像は最大3枚分入力されるので、直列で実行する
    try:
        print("upload_image1")
        # InMemoryUploadedFileオブジェクトからバイナリデータを取得する
        image = requests.FILES['upload_image1']#.read()   #file_preview
        #uploaded_file = requests.FILES['upload_image3']
        #with open(uploaded_file.temporary_file_path(), 'rb') as f:
        #    image = f.read()


        print("base64エンコード")
        # バイナリデータをbase64エンコードする
        base64_image_data = base64.b64encode(image).decode('utf-8')
        print("リサイズ")
        # 画像をリサイズする
        base64_image_data = resize_image(base64_image_data, 4000)
        print("API_CLIP実行")
        # RestAPI_CLIPの実行
        result1 = api_run_clip(base64_image_data, list_txt, list_txt_bin)
    except Exception as e:
        print(f"upload_image1: エラーが発生しました: {e}")
        result1 = ["err", "err", "err", "err", "err"]

    try:
        print("upload_image2")
        # InMemoryUploadedFileオブジェクトからバイナリデータを取得する
        image = requests.FILES['upload_image2'].read()
        # バイナリデータをbase64エンコードする
        base64_image_data = base64.b64encode(image).decode('utf-8')
        # 画像をリサイズする
        base64_image_data = resize_image(base64_image_data, 4000)
        # RestAPI_CLIPの実行
        result2 = api_run_clip(base64_image_data, list_txt, list_txt_bin)
    except Exception as e:
        print(f"upload_image2: エラーが発生しました: {e}")
        result2 = ["err", "err", "err", "err", "err"]

    try:
        print("upload_image3")
        # InMemoryUploadedFileオブジェクトからバイナリデータを取得する
        image = requests.FILES['upload_image3'].read()
        # バイナリデータをbase64エンコードする
        base64_image_data = base64.b64encode(image).decode('utf-8')
        # 画像をリサイズする
        base64_image_data = resize_image(base64_image_data, 4000)
        # RestAPI_CLIPの実行
        result3 = api_run_clip(base64_image_data, list_txt, list_txt_bin)
    except Exception as e:
        print(f"upload_image3: エラーが発生しました: {e}")
        result3 = ["err", "err", "err", "err", "err"]




    # レスポンス用のjsonデータ
    #result = {"clip_txt":result}
    result = {"clip_txt1":result1, "clip_txt2":result2, "clip_txt3":result3}    # 画像ごとに分けたい
    print(result)
    print("◆-- "*20)
    return JsonResponse(result)

    # 画像変換の実験
    # Pillowを使用して画像のグレースケール変換を行う
    #img = Image.open(image)
    #gray_img = img.convert('L')
    # 変換後の画像をメモリ上に一時的に保存
    #buf = io.BytesIO()
    #gray_img.save(buf, format='PNG')
    #image_base64 = base64.b64encode(buf.getvalue()).decode().replace("'", "")
    #response_data = {'image_url': image_base64}
    #return JsonResponse(response_data)


# anime2sketchによる線画変換
# opencvの画像変換
def anime2sketch(requests):
    print("◆func: anime2sketch はじまる")
    return render(requests, 'anime2sketch.html')

@csrf_exempt
def anime2sketch_bg(requests):
    from urllib.parse import urlencode
    import urllib.request
    import http.client

    # Ajaxで画像取得→API→返値をブラウザに反映
    print("◆func: clip_org_bg はじまる")

    #image = requests.FILES["upload_image"]
    # InMemoryUploadedFileオブジェクトからバイナリデータを取得する
    image = requests.FILES['upload_image'].read()
    # バイナリデータをbase64エンコードする
    base64_image_data = base64.b64encode(image).decode('utf-8')

    # RestAPIにリクエストを送る
    url = '127.0.0.1:8000'
    headers = {'Content-Type': 'application/json'}
    #json_data = {'key': 'value'}
    data = {'img': base64_image_data}
    json_data = json.dumps(data)#.encode('utf-8')

    conn = http.client.HTTPConnection(url)
    conn.request(method='POST', url='/myapi/anime2sketch/', body=json_data, headers=headers)
    response = conn.getresponse()
    body = response.read().decode('utf-8')
    conn.close()
    
    print("◆ "*10)
    response_data = json.loads(body)
    print(type(response_data))
    return JsonResponse(response_data)

    # 画像変換の実験
    # Pillowを使用して画像のグレースケール変換を行う
    #img = Image.open(image)
    #gray_img = img.convert('L')
    # 変換後の画像をメモリ上に一時的に保存
    #buf = io.BytesIO()
    #gray_img.save(buf, format='PNG')
    #image_base64 = base64.b64encode(buf.getvalue()).decode().replace("'", "")
    #response_data = {'image_url': image_base64}
    #return JsonResponse(response_data)



# マイクから受け取った音声データを一時ファイルに保存する関数
def save_audio_data(data):
    #try:
    print("一時ファイル作成！")
    #with tempfile.NamedTemporaryFile(suffix=".wav", delete=False, dir="./media/temp") as tmpfile:
    #    tmpfile.write(data)
    #    print(tmpfile.name)
    #    print("◆ "*10)
    #    return tmpfile.name



    # 保存する音声データとサンプリングレートを設定
    sound_data = data
    sample_rate = 44100

    # ヘッダーの情報を設定
    #nchannels = 1  # モノラル
    #sampwidth = 2  # 16ビット
    #framerate = sample_rate
    #nframes = len(sound_data)
    #comptype = "NONE"
    #compname = "not compressed"

    ## ヘッダーを作成
    #header_data = struct.pack("<4sI4sIHHIIHH4sI",
    #                        b"RIFF",
    #                        36 + nframes * sampwidth,
    #                        b"WAVE",
    #                        b"fmt ",
    #                        16,
    #                        1,
    #                        nchannels,
    #                        framerate,
    #                        nchannels * sampwidth,
    #                        sampwidth,
    #                        b"data",
    #                        nframes * sampwidth)

    riff = b'RIFF'
    file_size = len(sound_data) + 36
    wave = b'WAVE'
    fmt = b'fmt '
    fmt_chunk_size = 16
    audio_format = 1
    num_channels = 1
    sample_rate = 44100
    byte_rate = sample_rate * num_channels * 2
    block_align = num_channels * 2
    bits_per_sample = 16
    data = b'data'
    data_chunk_size = len(sound_data)
    nframes = len(sound_data)

    header_data = struct.pack("<4sI4s4sIHHIIHH4sI",
                            riff, file_size, wave, fmt, fmt_chunk_size, audio_format,
                            num_channels, sample_rate, byte_rate, block_align, bits_per_sample,
                            data, data_chunk_size)

    # 音声データをバイナリに変換
    sound_data_bin = struct.pack("<" + str(nframes) + "h", *sound_data)

    # WAVファイルを保存
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False, dir="./media/temp") as tmpfile:
        tmpfile.write(header_data + sound_data_bin)
        filename = tmpfile.name

        print("Saved WAV file:", filename)
        return tmpfile.name



    
    # 230404
    #filename = "./media/temp/temp.wav"
    #sample_rate = 44100
    #sound_data = data
    #print("書き込む")
    #wav.write(filename, sample_rate, sound_data)
    #print("書き込んだ")

    ## blobデータをWAVファイルに変換_230405
    #wav_data = data
    #sample_rate = 44100 #44100 # サンプリングレート
    #wav_io = wav_data

    #with wave.open(filename, 'wb') as wavfile:
    #    wavfile.setnchannels(1)
    #    wavfile.setsampwidth(2)
    #    wavfile.setframerate(sample_rate)
    #    wavfile.writeframes(wav_data)


    print("保存！")

    return filename
    #except:
    #    print("一時ファイル作成_エラー処理発生！！")


# Ajaxリクエストを処理する関数
@csrf_exempt
def whisper_v2t(request):
    if request.method == "POST":
        print("音声取得！")

        # Ajaxリクエストから音声データを取得する
        data = io.BytesIO(request.body)
        
        # 一時ファイル作成
        #sound_data = np.frombuffer(data.read(), dtype=np.int16)
        #filename = save_audio_data(sound_data)
        filename = save_audio_data(data.read())
        print(type(filename))
        print(filename)
        print("= - - "*10)


        # 音声ファイルをテキストに変換する
        # 流れてはいるけど推論できていない（結果がyouになる）
        # wavデータも1つ目以外は正常に保存できていないぽい
        # 推論速度遅すぎて遅延が生じているかも

        with open(filename, mode="rb") as file:
            file_bytes = file.read()

        # バイト列をメモリバッファに読み込む
        file_buffer = io.BytesIO(file_bytes)

        # メモリバッファからnumpy配列に変換する
        buffer = file_buffer.read()
        if len(buffer) % 2 != 0:
            buffer = buffer[:len(buffer)-1]
        audio_data = np.frombuffer(buffer, dtype=np.int16)
        audio_data = audio_data.astype('float32') / 32768.0  # 小数点表記に変換
        #audio_data = np.frombuffer(file_buffer.read(), dtype=np.int16)

        print("推論: voice2text")
        result = model.transcribe(audio_data)
        print("文字変換の結果は:")
        print(result["text"])
        text = result["text"]
        #text = "てきすと"

        # テキストをJSONレスポンスに変換する
        response_data = {"transcript": text}
        print("音声の文字をリターン")
        return JsonResponse(response_data)

    return JsonResponse({})


