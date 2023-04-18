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

$('#clip_org_ajax').on('submit', function(e) {
    e.preventDefault();
    let fd = new FormData($("#clip_org_ajax").get(0));
    //fd.append($("#txt1"))
    console.log("clip_org_ajax実行")
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
        console.log("clip-done")
        console.log(response.clip_txt)
        $('input[name="txt1_result"]').val(response.clip_txt[0]);
        $('input[name="txt2_result"]').val(response.clip_txt[1]);
        $('input[name="txt3_result"]').val(response.clip_txt[2]);
        $('input[name="txt4_result"]').val(response.clip_txt[3]);
        $('input[name="txt5_result"]').val(response.clip_txt[4]);

        //let blob = b64toBlob(response.image_url, "image/png");
        //let imgUrl = URL.createObjectURL(blob);
        //$('#result_clip').get(0).src = imgUrl;
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
  