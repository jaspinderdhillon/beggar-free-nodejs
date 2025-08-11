$(document).ready(function(){
   document.getElementById('email').value = sessionStorage.getItem('loggedInEmail');
    $('#idproof').on('change', function(e){
        const [file] = this.files;
        if (file) {
            $('#idproofPreview').attr('src', URL.createObjectURL(file)).show();
        } else {
            $('#idproofPreview').hide();
        }
    });
    // Image preview for selfpicproof
    $('#selfpicproof').on('change', function(e){
        const [file] = this.files;
        if (file) {
            $('#selfpicproofPreview').attr('src', URL.createObjectURL(file)).show();
        } else {
            $('#selfpicproofPreview').hide();
        }
    });

    // This function is used to fill the form with the data from the server.
    // It sets the values of the form fields to the values from the data object.
    // It also shows the preview image if the idproof is present.
    function fillForm(data) {
        $('#name').val(data.name || '');
        $('#firm').val(data.firm || '');
        $('#business_profile').val(data.business_profile || '');
        $('#contact').val(data.contact || '');
        $('#address').val(data.address || '');
        $('#city').val(data.city || '');
        $('#gender').val(data.gender || '');
        $('#dob').val(data.dob || '');
        $('#idproofnum').val(data.idproofnum || '');
        $('#otherinfo').val(data.otherinfo || '');
        $('#idproof_old').val(data.idproof || '');
        $('#selfpicproof_old').val(data.selfpicproof || '');
        if(data.idproof) {
            $('#idproofPreview').attr('src', data.idproof).show();
        }
        if(data.selfpicproof) {
            $('#selfpicproofPreview').attr('src', data.selfpicproof).show();
        }
    }

    // Save (register new client profile)
    $('#saveBtn').click(function(){
        let formData = new FormData($('#clientForm')[0]);
        let obj = {
            type: 'POST',
            url: '/register-client',
            data: formData,
            processData: false,
            contentType: false
        };
        $.ajax(obj)
        .then(function(res){
            console.log('Save response:', res);
            $('#msg').text(res.message || 'Saved!');
        }).fail(function(xhr){
            console.log('Save error:', xhr);
            $('#msg').text(xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Error');
        });
    });

    // Update (update existing client profile)
    $('#updateBtn').click(function(){
        let formData = new FormData($('#clientForm')[0]);
        let obj = {
            type: 'POST',
            url: '/update-client',
            data: formData,
            processData: false,
            contentType: false
        };
        $.ajax(obj)
        .then(function(res){
            console.log('Update response:', res);
            $('#msg').text(res.message || 'Updated!');
        }).fail(function(xhr){
            console.log('Update error:', xhr);
            $('#msg').text(xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Error');
        });
    });

    // Search (fetch client profile)
    $('#searchBtn').click(function(){
        let email = $('#email').val();
        if(!email) return $('#msg').text('Enter email to search');
        let obj = {
            type: 'GET',
            url: '/fetch-client',
            data: { email: email }
        };
        $.ajax(obj)
        .then(function(res){
            console.log('Search response:', res);
            let arr = Array.isArray(res) ? res : [res];
            if(arr.length === 0 || arr[0].email !== email) {
                $('#msg').text('Profile not found!');
                return;
            }
            fillForm(arr[0]);
            $('#updateBtn').show();
            $('#msg').text('Profile fetched!');
        }).fail(function(xhr){
            console.log('Search error:', xhr);
            $('#msg').text(xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Not found');
        });
    });
}); 