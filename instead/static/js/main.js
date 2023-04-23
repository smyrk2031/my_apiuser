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
        inputs.css({"color": "blue", "font-weight": "normal"});
    } else {
        // 配列の中で最大値のインデックスを取得する
        var maxIndex = values.indexOf(Math.max.apply(null, values));
        // 各 input 要素のスタイルを設定する
        inputs.each(function(index) {
            if (index === maxIndex) {
                $(this).css({"color": "red", "font-weight": "bold"});
            } else {
                $(this).css({"color": "black", "font-weight": "normal"});
            }
        });
    };
}

$('#clip_org_ajax').on('submit', function(e) {
    e.preventDefault();
    let fd = new FormData($("#clip_org_ajax").get(0));
    console.log("clip_org_ajax実行")
    // フォームデータを確認する
    //for (let pair of fd.entries()) {
    //    console.log(pair[0] + ': ' + pair[1]);
    //}

    $.ajax({
        //'url': '{% url "voice:clip_org_bg" %}',
        'url': '/clip_org/clip_org_bg/',
        'type': 'POST',
        'data': fd,
        'processData': false,
        'contentType': false,
        'dataType': 'json',
    })
    .done(function(response){
        console.log("ajax-done")
        ////Ajax通信が成功した場合に実行する処理
        //console.log(response.clip_txt)
        
        $('input[name="result1_txt1"]').val(response.clip_txt1[0]);
        $('input[name="result1_txt2"]').val(response.clip_txt1[1]);
        $('input[name="result1_txt3"]').val(response.clip_txt1[2]);
        $('input[name="result1_txt4"]').val(response.clip_txt1[3]);
        $('input[name="result1_txt5"]').val(response.clip_txt1[4]);

        $('input[name="result2_txt1"]').val(response.clip_txt2[0]);
        $('input[name="result2_txt2"]').val(response.clip_txt2[1]);
        $('input[name="result2_txt3"]').val(response.clip_txt2[2]);
        $('input[name="result2_txt4"]').val(response.clip_txt2[3]);
        $('input[name="result2_txt5"]').val(response.clip_txt2[4]);

        $('input[name="result3_txt1"]').val(response.clip_txt3[0]);
        $('input[name="result3_txt2"]').val(response.clip_txt3[1]);
        $('input[name="result3_txt3"]').val(response.clip_txt3[2]);
        $('input[name="result3_txt4"]').val(response.clip_txt3[3]);
        $('input[name="result3_txt5"]').val(response.clip_txt3[4]);

        // 数字の最も大きいものを赤色太字にする
        //   ※数字以外が入っている場合はすべて黒文字（errなど）
        clip_result_marker($("input[name^='result1']"))
        clip_result_marker($("input[name^='result2']"))
        clip_result_marker($("input[name^='result3']"))
        console.log("clip-done 完了！！！")

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

// Whisper-Ajax
$('#ajax-file-send').on('submit', function(e) {
    e.preventDefault();
    var fd = new FormData($("#ajax-file-send").get(0));
    $.ajax({
        'url': '{% url "ajax_file_send" %}',
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
  