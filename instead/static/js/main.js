// Django-Ajax
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

// Ajax通信
console.log("Ajaxファイルの読込完了")
// ---------------------------------------------------------------------------------
// CLIP_org-Ajax
// ---------------------------------------------------------------------------------
//　base64のHTML imgタグへの反映用に必要！
function b64toBlob(b64Data, contentType, sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

// CLIP結果のテキスト相対評価のうち、数字の最も大きいものを赤色太字にする
function clip_result_marker(inputs) {
    console.log("色付ける")
    // 各input要素の値を取得し、配列に格納する
    //var inputs = $("input[name^='result1']");
    var values = [];
    var hasNonNumericValue = false;
    inputs.each(function(index) {
      var value = parseFloat($(this).val());
      if (isNaN(value)) {
        hasNonNumericValue = true;
        return false;
      }
      values.push(value);
    });
    
    if (hasNonNumericValue) {
        // 数字以外が混入している場合（errやNoImageの時）
        inputs.css({"color": "blue", "font-weight": "normal", "font-size":"1.25rem", "text-align":"center"});
    } else {
        // 配列の中で最大値のインデックスを取得する
        var maxIndex = values.indexOf(Math.max.apply(null, values));
        // 各 input 要素のスタイルを設定する
        inputs.each(function(index) {
            if (index === maxIndex) {
                $(this).css({"color": "red", "font-weight": "bold", "font-size":"1.7rem", "text-align":"center"});
            } else {
                $(this).css({"color": "black", "font-weight": "normal","font-size":"1.25em", "text-align":"center"});
            }
        });
    };
}

$('#clip_org_ajax_01').on('submit', function(e) {
//$('#btn_ajax').on('click', function(e) {
    e.preventDefault();
    var clickedClass = e.target.className;
    console.log("クリックイベント トリガのclassは：", clickedClass)

    // クリックイベントトリガのクラスを確認し、取得Formを選定する
    if (clickedClass === "btn_ajax_01"){
        console.log("おためしモード用")
        var fd = new FormData($("#clip_org_ajax_01").get(0));
        
        // FS:入力画像有無判定：すべてのsrc属性が'noimage.png'を含む場合にアラートを表示
        if ($('#file_preview1').attr('src').indexOf('noimage.png') !== -1 && $('#file_preview2').attr('src').indexOf('noimage.png') !== -1 && $('#file_preview3').attr('src').indexOf('noimage.png') !== -1) {
            alert('InputImageError: 画像を選択してください。');
            return;
        }
        // FS:プロンプト設定判定：プロンプトが無いケース、重複しているケースでアラートを表示
        let prompt_boolarray = [fd.get("txt1"),fd.get("txt2"),fd.get("txt3"),fd.get("txt4"),fd.get("txt5")];
        let falseCount = 0;
        let prompt_chk = "OK";
        for (let i=0; i < prompt_boolarray.length; i++) {
            if (prompt_boolarray[i] === "") {
                falseCount++;
            } else {
                for (let j = i + 1; j < prompt_boolarray.length; j++) {
                    if (prompt_boolarray[i] === prompt_boolarray[j]) {
                        prompt_chk = "NG";
                    }
                }
            }
        }
        if (falseCount === 5) {
            alert('InputPromptError: プロンプトを設定してください。');
            return;
        } else if (falseCount >= 4) {
            alert('InputPromptError: プロンプトを2つ以上設定してください。');
            return;
        } else if (prompt_chk === "NG") {
            alert('InputPromptError: プロンプトは重複しない様に設定してください。');
            return;
        }
        

    } else if (clickedClass === "btn_ajax_02"){
        console.log("チャレンジモード")
        var fd = new FormData($("#clip_org_ajax_02").get(0));
    } else if (clickedClass === "btn_ajax_03"){
        console.log("使うモード")
        var fd = new FormData($("#clip_org_ajax_03").get(0));
        fd.append("mode","use");

    } else {
        console.log("想定外のクラスを持つボタン要素がトリガになっています。修正が必要です")
    }


    console.log("clip_org_ajax実行")
    
    // フォームデータを確認する
    //for (let pair of fd.entries()) {
    //    console.log(pair[0] + ': ' + pair[1]);
    //}

    // 実行中のくるくる表示
    console.log("くるくる")
    $("#overlay").fadeIn(300);

    $.ajax({
        //'url': '{% url "instead:clip_org_bg" %}',
        'url': '/clip_org/clip_org_bg/',
        'type': 'POST',
        'data': fd,
        'processData': false,
        'contentType': false,
        'dataType': 'json',
    })
    .done(function(response){
        setTimeout(function(){
            $("#overlay").fadeOut(100);
        },200);
        
        console.log("ajax-done")
        // クリックイベントトリガのクラスを確認し、取得Formを選定する
        if (clickedClass === "btn_ajax_01"){
            ////Ajax通信が成功した場合に実行する処理
            // プロンプトごとの相対比較の値を表示する
            $('input[name="result1_01_txt1"]').val((response.clip_txt1[0]));
            $('input[name="result1_01_txt2"]').val((response.clip_txt1[1]));
            $('input[name="result1_01_txt3"]').val((response.clip_txt1[2]));
            $('input[name="result1_01_txt4"]').val((response.clip_txt1[3]));
            $('input[name="result1_01_txt5"]').val((response.clip_txt1[4]));

            $('input[name="result2_01_txt1"]').val((response.clip_txt2[0]));
            $('input[name="result2_01_txt2"]').val((response.clip_txt2[1]));
            $('input[name="result2_01_txt3"]').val((response.clip_txt2[2]));
            $('input[name="result2_01_txt4"]').val((response.clip_txt2[3]));
            $('input[name="result2_01_txt5"]').val((response.clip_txt2[4]));

            $('input[name="result3_01_txt1"]').val((response.clip_txt3[0]));
            $('input[name="result3_01_txt2"]').val((response.clip_txt3[1]));
            $('input[name="result3_01_txt3"]').val((response.clip_txt3[2]));
            $('input[name="result3_01_txt4"]').val((response.clip_txt3[3]));
            $('input[name="result3_01_txt5"]').val((response.clip_txt3[4]));

            // 数字の最も大きいものを赤色太字にする
            //   ※数字以外が入っている場合はすべて黒文字（errなど）
            clip_result_marker($("input[name^='result1_01']"))
            clip_result_marker($("input[name^='result2_01']"))
            clip_result_marker($("input[name^='result3_01']"))
        } else {
            console.log("想定外のクラスを持つボタン要素がトリガになっています。修正が必要です")
        }
        console.log("clip-done 完了！！！")

    })
    // ↓ここでAjax処理に失敗した場合にコンソールにlogを出力するように設定している。
    .fail(function(jqXHR, textStatus, errorThrown) {
        setTimeout(function(){
            $("#overlay").fadeOut(100);
        },200);
        console.log('Fail-Error!');
        console.log(e.target.className)
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
        alert("error！");
    })
});




$('#clip_org_ajax_02').on('submit', function(e) {
    //$('#btn_ajax').on('click', function(e) {
        e.preventDefault();
        var clickedClass = e.target.className;
        console.log("クリックイベント トリガのclassは：", clickedClass)
    
        // クリックイベントトリガのクラスを確認し、取得Formを選定する
        if (clickedClass === "btn_ajax_02"){
            console.log("おためしモード用")
            var fd = new FormData($("#clip_org_ajax_02").get(0));
            
            // FS:入力画像有無判定：すべてのsrc属性が'noimage.png'を含む場合にアラートを表示
            //if ($('#file_preview1_02').attr('src').indexOf('noimage.png') !== -1 && $('#file_preview2_02').attr('src').indexOf('noimage.png') !== -1 && $('#file_preview3_02').attr('src').indexOf('noimage.png') !== -1) {
            //    alert('InputImageError: 画像を選択してください。');
            //    return;
            //}
            // FS:プロンプト設定判定：プロンプトが無いケース、重複しているケースでアラートを表示
            let prompt_boolarray = [fd.get("txt1_02"),fd.get("txt2_02"),fd.get("txt3_02"),fd.get("txt4_02"),fd.get("txt5_02")];
            let falseCount = 0;
            let prompt_chk = "OK";
            for (let i=0; i < prompt_boolarray.length; i++) {
                if (prompt_boolarray[i] === "") {
                    falseCount++;
                } else {
                    for (let j = i + 1; j < prompt_boolarray.length; j++) {
                        if (prompt_boolarray[i] === prompt_boolarray[j]) {
                            prompt_chk = "NG";
                        }
                    }
                }
            }
            if (falseCount === 5) {
                alert('InputPromptError: プロンプトを設定してください。');
                return;
            } else if (falseCount >= 4) {
                alert('InputPromptError: プロンプトを2つ以上設定してください。');
                return;
            } else if (prompt_chk === "NG") {
                alert('InputPromptError: プロンプトは重複しない様に設定してください。');
                return;
            }
        } else {
            console.log("想定外のクラスを持つボタン要素がトリガになっています。修正が必要です")
        }
    
    
        console.log("clip_org_ajax実行")
        
        // フォームデータを確認する
        //for (let pair of fd.entries()) {
        //    console.log(pair[0] + ': ' + pair[1]);
        //}
    
        // 実行中のくるくる表示
        console.log("くるくる")
        $("#overlay").fadeIn(300);
    
        $.ajax({
            //'url': '{% url "instead:clip_org_bg" %}',
            'url': '/clip_org/clip_org_bg/',
            'type': 'POST',
            'data': fd,
            'processData': false,
            'contentType': false,
            'dataType': 'json',
        })
        .done(function(response){
            setTimeout(function(){
                $("#overlay").fadeOut(100);
            },200);
            
            console.log("ajax-done")
            // クリックイベントトリガのクラスを確認し、取得Formを選定する
            if (clickedClass === "btn_ajax_02"){
                ////Ajax通信が成功した場合に実行する処理
                console.log("ajax_done_チャレンジモード！")
                // プロンプトごとの相対比較の値を表示する
                $('input[name="result1_02_txt1"]').val((response.clip_txt1[0]));
                $('input[name="result1_02_txt2"]').val((response.clip_txt1[1]));
                $('input[name="result1_02_txt3"]').val((response.clip_txt1[2]));
                $('input[name="result1_02_txt4"]').val((response.clip_txt1[3]));
                $('input[name="result1_02_txt5"]').val((response.clip_txt1[4]));
                $('input[name="result2_02_txt1"]').val((response.clip_txt2[0]));
                $('input[name="result2_02_txt2"]').val((response.clip_txt2[1]));
                $('input[name="result2_02_txt3"]').val((response.clip_txt2[2]));
                $('input[name="result2_02_txt4"]').val((response.clip_txt2[3]));
                $('input[name="result2_02_txt5"]').val((response.clip_txt2[4]));
                $('input[name="result3_02_txt1"]').val((response.clip_txt3[0]));
                $('input[name="result3_02_txt2"]').val((response.clip_txt3[1]));
                $('input[name="result3_02_txt3"]').val((response.clip_txt3[2]));
                $('input[name="result3_02_txt4"]').val((response.clip_txt3[3]));
                $('input[name="result3_02_txt5"]').val((response.clip_txt3[4]));
    
                $('input[name="result4_02_txt1"]').val((response.clip_txt4[0]));
                $('input[name="result4_02_txt2"]').val((response.clip_txt4[1]));
                $('input[name="result4_02_txt3"]').val((response.clip_txt4[2]));
                $('input[name="result4_02_txt4"]').val((response.clip_txt4[3]));
                $('input[name="result4_02_txt5"]').val((response.clip_txt4[4]));
                $('input[name="result5_02_txt1"]').val((response.clip_txt5[0]));
                $('input[name="result5_02_txt2"]').val((response.clip_txt5[1]));
                $('input[name="result5_02_txt3"]').val((response.clip_txt5[2]));
                $('input[name="result5_02_txt4"]').val((response.clip_txt5[3]));
                $('input[name="result5_02_txt5"]').val((response.clip_txt5[4]));
                $('input[name="result6_02_txt1"]').val((response.clip_txt6[0]));
                $('input[name="result6_02_txt2"]').val((response.clip_txt6[1]));
                $('input[name="result6_02_txt3"]').val((response.clip_txt6[2]));
                $('input[name="result6_02_txt4"]').val((response.clip_txt6[3]));
                $('input[name="result6_02_txt5"]').val((response.clip_txt6[4]));
    
                $('input[name="result7_02_txt1"]').val((response.clip_txt7[0]));
                $('input[name="result7_02_txt2"]').val((response.clip_txt7[1]));
                $('input[name="result7_02_txt3"]').val((response.clip_txt7[2]));
                $('input[name="result7_02_txt4"]').val((response.clip_txt7[3]));
                $('input[name="result7_02_txt5"]').val((response.clip_txt7[4]));
                $('input[name="result8_02_txt1"]').val((response.clip_txt8[0]));
                $('input[name="result8_02_txt2"]').val((response.clip_txt8[1]));
                $('input[name="result8_02_txt3"]').val((response.clip_txt8[2]));
                $('input[name="result8_02_txt4"]').val((response.clip_txt8[3]));
                $('input[name="result8_02_txt5"]').val((response.clip_txt8[4]));
                $('input[name="result9_02_txt1"]').val((response.clip_txt9[0]));
                $('input[name="result9_02_txt2"]').val((response.clip_txt9[1]));
                $('input[name="result9_02_txt3"]').val((response.clip_txt9[2]));
                $('input[name="result9_02_txt4"]').val((response.clip_txt9[3]));
                $('input[name="result9_02_txt5"]').val((response.clip_txt9[4]));
    
                $('input[name="result10_02_txt1"]').val((response.clip_txt10[0]));
                $('input[name="result10_02_txt2"]').val((response.clip_txt10[1]));
                $('input[name="result10_02_txt3"]').val((response.clip_txt10[2]));
                $('input[name="result10_02_txt4"]').val((response.clip_txt10[3]));
                $('input[name="result10_02_txt5"]').val((response.clip_txt10[4]));
                $('input[name="result11_02_txt1"]').val((response.clip_txt11[0]));
                $('input[name="result11_02_txt2"]').val((response.clip_txt11[1]));
                $('input[name="result11_02_txt3"]').val((response.clip_txt11[2]));
                $('input[name="result11_02_txt4"]').val((response.clip_txt11[3]));
                $('input[name="result11_02_txt5"]').val((response.clip_txt11[4]));
                $('input[name="result12_02_txt1"]').val((response.clip_txt12[0]));
                $('input[name="result12_02_txt2"]').val((response.clip_txt12[1]));
                $('input[name="result12_02_txt3"]').val((response.clip_txt12[2]));
                $('input[name="result12_02_txt4"]').val((response.clip_txt12[3]));
                $('input[name="result12_02_txt5"]').val((response.clip_txt12[4]));
    
                // 数字の最も大きいものを赤色太字にする
                //   ※数字以外が入っている場合はすべて黒文字（errなど）
                clip_result_marker($("input[name^='result1_02']"))
                clip_result_marker($("input[name^='result2_02']"))
                clip_result_marker($("input[name^='result3_02']"))
                clip_result_marker($("input[name^='result4_02']"))
                clip_result_marker($("input[name^='result5_02']"))
                clip_result_marker($("input[name^='result6_02']"))
                clip_result_marker($("input[name^='result7_02']"))
                clip_result_marker($("input[name^='result8_02']"))
                clip_result_marker($("input[name^='result9_02']"))
                clip_result_marker($("input[name^='result10_02']"))
                clip_result_marker($("input[name^='result11_02']"))
                clip_result_marker($("input[name^='result12_02']"))

                // 結果を反映させる。getAccuracyなら正解率、incorrectなら一致数
                console.log("正解率とか")
                console.log(response.incorrect)
                console.log(response.getAccuracy)
                $('label[name="incorrect_02"]').text((response.incorrect));
                $('label[name="accuracy_02"]').text((response.getAccuracy));

    
            } else if (clickedClass === "btn_ajax_03"){
                console.log("ajax_done_使うモード！まだないよ！")
            } else {
                console.log("想定外のクラスを持つボタン要素がトリガになっています。修正が必要です")
            }
            console.log("clip-done 完了！！！")
    
        })
        // ↓ここでAjax処理に失敗した場合にコンソールにlogを出力するように設定している。
        .fail(function(jqXHR, textStatus, errorThrown) {
            setTimeout(function(){
                $("#overlay").fadeOut(100);
            },200);
    
            console.log('Fail-Error!');
            console.log(e.target.className)
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
            alert("error！");
        })
    });

    


// 画像の線画変換
$('#anime2sketch').on('submit', function(e) {
    e.preventDefault();
    let fd = new FormData($("#anime2sketch").get(0));
    console.log("anime2sketch実行")
    $.ajax({
        //'url': '{% url "voice:clip_org_bg" %}',
        'url': '/anime2sketch/anime2sketch_bg/',
        'type': 'POST',
        'data': fd,
        'processData': false,
        'contentType': false,
        'dataType': 'json',
    })
    .done(function(response){
        console.log("ajax-done")
        ////Ajax通信が成功した場合に実行する処理
        let blob = b64toBlob(response.image_url, "image/png");
        let imgUrl = URL.createObjectURL(blob);
        $('#result_anime2sketch').get(0).src = imgUrl;
    })
    // ↓ここでAjax処理に失敗した場合にコンソールにlogを出力するように設定している。
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log('Fail-Error!');
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
        alert("error！");
    })
});

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

// 音声→テキスト変換：Whisper-Ajax
$('#ajax-file-send').on('submit', function(e) {
    e.preventDefault();
    var fd = new FormData($("#ajax-file-send").get(0));
    $.ajax({
        //'url': '{% url "ajax_file_send" %}',
        'url': "{% url 'voice:clip_org_bg' %}",
        'type': 'POST',
        'data': fd,
        'processData': false,
        'contentType': false,
        'dataType': 'json'
    })
    .done(function(response){
        //Ajax通信が成功した場合に実行する処理
    });
});

// 録音中に指定時間が経過すると音声データが出来上がって、ここのBlobで送られてくる
function sendBlob(blob) {
    console.log("ajax")
    const csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]').value;
    const formData = new FormData();
    formData.append('audio', blob);
  
    $.ajax({
      type: 'POST',
      url: '/whisper_v2t/',
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        'X-CSRFToken': csrfToken
      },
      success: function(response) {
        const transcript = document.getElementById('transcript');
        transcript.innerHTML += response.transcript;
      },
      error: function() {
        console.log('Error occurred during transcription.');
      }
    });
  }
  