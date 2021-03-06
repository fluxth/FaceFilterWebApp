function timeDifference(current, previous) {
  let msPerMinute = 60 * 1000;
  let msPerHour = msPerMinute * 60;
  let msPerDay = msPerHour * 24;
  let msPerMonth = msPerDay * 30;
  let msPerYear = msPerDay * 365;

  let elapsed = current - previous;

  if (elapsed < 10 * 1000)
    return 'just now';
  
  if (elapsed < msPerMinute) 
    return Math.round(elapsed/1000) + 's ago';
  
  if (elapsed < msPerHour) 
    return Math.round(elapsed/msPerMinute) + 'm ago';
  
  if (elapsed < msPerDay) 
    return Math.round(elapsed/msPerHour) + 'h ago';
  
  if (elapsed < msPerMonth) 
    return Math.round(elapsed/msPerDay) + 'd ago';
  
  if (elapsed < msPerYear) 
    return Math.round(elapsed/msPerMonth) + 'mo ago';
  
  return Math.round(elapsed/msPerYear) + 'y ago';
}

function readImageFile(input, cb) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    
    reader.onload = cb;    
    reader.readAsDataURL(input.files[0]); // convert to base64 string
  }
}

function resetUploadInput() {
  $('#image-path-label').text('Choose file').addClass('text-muted');
  $('#upload-preview').hide();
  clearError();
}

function errorString(es, o) {
    if (o.status === 413) es = 'Image filesize exceeded the maximum allowed';
    else if (o.status === 502) es = 'Bad Gateway, please try again later';
    else if (o.status === 503) es = 'Service Unavaliable, please try again later';
    else if (o.status === 504) es = 'Gateway Timeout, please try again later';
    else if (o.status === 521) es = 'Web server is currently offline, please try again later';
    else if (es === '') {
      if (o.status === 0)
        es = 'Cannot connect to the server';
      else
        es = 'HTTP ' + o.status;
    }

    return es;
}

function refreshImageList(showSpinner) {
  if (showSpinner !== false)
    $('#image-list-spinner').show();

  let currentTime = new Date();

  let errorTail = '. Please try again later.';

  $.ajax({
    url: '/api/list_images',
    success: function(data) {
      if (data.status == 'success') {
        clearILError();
        let html = '';

        if (data.count > 0) {
          for (i = 0; i < data.count; ++i) {
            let item = data.data[i];
            let d = Date.parse(item.timestamp);
            let timeDiff = timeDifference(currentTime, d);
            html += `
            <div class="col-md-4">
              <div class="card mb-4 box-shadow">
                <a href="${item.image_url}" target="_blank"><img class="card-img-top" src="${item.image_url}"></a>
                <div class="card-body">
                  <p class="card-text">Uploaded by <b>${item.username}</b></p>
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="badge badge-primary"><i class="fas fa-magic"></i> ${item.filter_used}</span>
                    <span class="badge badge-secondary"><i class="far fa-smile-wink"></i> ${item.face_count}</span>
                    <small class="text-muted">${timeDiff}</small>
                  </div>
                </div>
              </div>
            </div>`;
          }
        } else {
          html += '<p class="text-muted">No uploaded images.</p>';
        }

        $('#image-list').html(html);
        $('#image-list-spinner').hide();
        return;
      }

      if (data.status == 'error') {
        showILError(data.message);
        return;
      }

      showILError('Unknown Error');
    },
    error: function(o, e, es) {
      showILError(errorString(es, o));
    }
  });
}

function showError(msg) {
  $('#upload-error-alert').find('span.error-message').text(msg);
  $('#upload-error-alert').show();
  window.scrollTo(0, 0);
}

function clearError() {
  $('#upload-error-alert').hide();
}

function showILError(msg) {
  $('#imagelist-error-alert').find('span.error-message').text(msg);
  $('#imagelist-error-alert').show();
}

function clearILError() {
  $('#imagelist-error-alert').hide();
}
function showUploadStatus() {
  $('.upload-form-button').attr('disabled', 'disabled');
  $('#upload-submit-button').html('<i class="fa fa-spinner fa-spin"></i> Uploading...');
}

function resetUploadStatus() {
  $('.upload-form-button').removeAttr('disabled');
  $('#upload-submit-button').html('<i class="fas fa-cloud-upload-alt"></i> Upload!');
}

$(document).ready(() => {
  $('#image-file-input').change(function() {
    let filepath = $(this).val();
    if (filepath.length == 0) {
      resetUploadInput();
      return;
    }

    let filename = filepath.split('\\').pop();
    let extension = filename.split('.').pop();
    if (!['png', 'jpg', 'jpeg'].includes(extension)) {
      alert('Only image files with extension "jpg", "png" and "jpeg" are allowed.');
      $(this).val(null);
      return;
    }

    $('#image-path-label').text(filename).removeClass('text-muted');

    clearError();

    $('#upload-preview').hide();
    $('#upload-spinner').show();

    readImageFile(this, function(e) {
      $('#upload-spinner').hide();
      $('#upload-preview').attr('src', e.target.result).show();
    });
  });

  $('#upload-reset-button').click(function() {
    resetUploadInput();
  });

  $('#upload-return-button').click(function() {
    $('#upload-reset-button').click();
    $('.result-view').hide();
    $('.upload-form').show();
    window.scrollTo(0, 0);
    return false;
  });

  $('.upload-form').submit(function(e) {
    e.preventDefault();
    clearError();

    let filesize = $('#image-file-input')[0].files[0].size;
    if (filesize > 12 * 1024 * 1024) {
        showError("Image filesize exceeded the maximum allowed");
        return false;  
    }

    showUploadStatus();

    let usernameInput = $('input[name=username]');
    if (usernameInput.val().length == 0) {
      $(usernameInput).val('Anonymous');
    }

    let formData = new FormData(this);
    $.ajax({
      url: '/api/upload',
      type: 'POST',
      cache: false,
      contentType: false,
      processData: false,
      data: formData,
      success: function(data) {
        window.scrollTo(0, 0);
        resetUploadStatus();

        if (data.status == 'success') {
          $('#image-result').attr('src', data.image_url);
          $('.result-view').show();
          $('.upload-form').hide();

          refreshImageList();
          return;
        }

        if (data.status == 'error') {
          showError(data.message);
          return;
        }

        showError("An unknown error occurred");
        return;
      },
      error: function(o, e, es) {
        window.scrollTo(0, 0);
        resetUploadStatus();

        showError(errorString(es, o));
      }
    });

    return false;
  });

  $('.jump-top').click(function() {
    window.scrollTo(0, 0);
    return false;
  });

  refreshImageList();

  setInterval(function() {
    refreshImageList(false);
  }, 10000);
});
