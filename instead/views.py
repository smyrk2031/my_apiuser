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
    return render(requests, 'clip_org.html')

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
    list_txt_bin = [x if list_txt[x] == True else None for x in range(len(list_txt))]

    # 空白は類似度が高くなりがちなので、空白がある場合は除外したい。

    # InMemoryUploadedFileオブジェクトからバイナリデータを取得する
    image = requests.FILES['upload_image'].read()
    # バイナリデータをbase64エンコードする
    base64_image_data = base64.b64encode(image).decode('utf-8')

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

    result = []
    for i in list_txt:
        try:
            result.append(response_data_dict[i])
        except:
            result.append(0)
    result = {"clip_txt":result}

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


