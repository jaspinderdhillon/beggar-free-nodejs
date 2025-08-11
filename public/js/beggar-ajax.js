$(document).ready(function(){
    // Set volunteer_email from sessionStorage
    const loggedInEmail = sessionStorage.getItem('loggedInEmail');
    if (loggedInEmail) {
        $('#volunteer_email').val(loggedInEmail);
    }

    // Image preview for idproof
    $('#idproof').on('change', function(e){
        const [file] = this.files;
        if (file) {
            $('#idproofPreview').attr('src', URL.createObjectURL(file)).show();
        } else {
            $('#idproofPreview').hide();
        }
    });

    // Image preview for photo
    $('#photo').on('change', function(e){
        const [file] = this.files;
        if (file) {
            $('#photoPreview').attr('src', URL.createObjectURL(file)).show();
        } else {
            $('#photoPreview').hide();
        }
    });

    function fillForm(data) {
        $('#name').val(data.name || '');
        $('#address').val(data.address || '');
        $('#contact').val(data.contact || '');
        $('#city').val(data.city || '');
        $('#gender').val(data.gender || '');
        $('#dob').val(data.dob ? data.dob.split('T')[0] : '');
        $('#idproofnum').val(data.idproofnum || '');
        $('#otherinfo').val(data.otherinfo || '');
        $('#volunteer_email').val(data.volunteer_email || '');

        if(data.idproof) {
            $('#idproofPreview').attr('src', data.idproof).show();
            $('#idproof_old').val(data.idproof);  // set hidden input
        } else {
            $('#idproofPreview').hide();
            $('#idproof_old').val('');
        }

        if(data.photo) {
            $('#photoPreview').attr('src', data.photo).show();
            $('#photo_old').val(data.photo);      // set hidden input
        } else {
            $('#photoPreview').hide();
            $('#photo_old').val('');
        }

        // Save to sessionStorage for apply-job
        sessionStorage.setItem('beggarName', data.name || '');
        sessionStorage.setItem('beggarIdProofNum', data.idproofnum || '');
        sessionStorage.setItem('beggarContact', data.contact || '');
        sessionStorage.setItem('beggarCity', data.city || '');

        // Trigger event for other parts of your app
        $(document).trigger('profileFetched', [data]);
    }

    $('#saveBtn').click(function(){
        let formData = new FormData($('#beggarForm')[0]);
        if (loggedInEmail) formData.set('volunteer_email', loggedInEmail);
        $.ajax({
            type: 'POST',
            url: '/register-beggar',
            data: formData,
            processData: false,
            contentType: false
        })
        .then(function(res){
            console.log('Save response:', res);
            $('#msg').text(res.message || 'Saved!');
            // Save to sessionStorage
            sessionStorage.setItem('beggarName', $('#name').val() || '');
            sessionStorage.setItem('beggarIdProofNum', $('#idproofnum').val() || '');
            sessionStorage.setItem('beggarContact', $('#contact').val() || '');
            sessionStorage.setItem('beggarCity', $('#city').val() || '');
            $(document).trigger('profileSaved', [{
                name: $('#name').val(),
                idproofnum: $('#idproofnum').val(),
                contact: $('#contact').val(),
                city: $('#city').val()
            }]);
        })
        .fail(function(xhr){
            console.log('Save error:', xhr);
            $('#msg').text(xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Error');
        });
    });

    $('#updateBtn').click(function(){
        let formData = new FormData($('#beggarForm')[0]);
        if (loggedInEmail) formData.set('volunteer_email', loggedInEmail);
        $.ajax({
            type: 'POST',
            url: '/update-beggar',
            data: formData,
            processData: false,
            contentType: false
        })
        .then(function(res){
            console.log('Update response:', res);
            $('#msg').text(res.message || 'Updated!');
            // Save to sessionStorage
            sessionStorage.setItem('beggarName', $('#name').val() || '');
            sessionStorage.setItem('beggarIdProofNum', $('#idproofnum').val() || '');
            sessionStorage.setItem('beggarContact', $('#contact').val() || '');
            sessionStorage.setItem('beggarCity', $('#city').val() || '');
            $(document).trigger('profileSaved', [{
                name: $('#name').val(),
                idproofnum: $('#idproofnum').val(),
                contact: $('#contact').val(),
                city: $('#city').val()
            }]);
        })
        .fail(function(xhr){
            console.log('Update error:', xhr);
            $('#msg').text(xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Error');
        });
    });

    $('#searchBtn').click(function(){
        let idproofnum = $('#idproofnum').val();
        if(!idproofnum) return $('#msg').text('Enter ID Proof Number to search');
        $.ajax({
            type: 'GET',
            url: '/fetch-beggars',
            data: { idproofnum: idproofnum }
        })
        .then(function(res){
            console.log('Search response:', res);
            let arr = Array.isArray(res) ? res : [res];
            if(arr.length === 0) {
                $('#msg').text('Profile not found!');
                return;
            }
            fillForm(arr[0]);
            $('#updateBtn').show();
            $('#msg').text('Profile fetched!');
        })
        .fail(function(xhr){
            console.log('Search error:', xhr);
            $('#msg').text(xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Not found');
        });
    });
});
