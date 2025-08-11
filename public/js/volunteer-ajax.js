function fillForm(data) {
        $('#name').val(data.name || '');
        $('#address').val(data.address || '');
        $('#contact').val(data.contact || '');
        $('#city').val(data.city || '');
        $('#gender').val(data.gender || '');
        $('#dob').val(data.dob ? data.dob.split('T')[0] : '');
        $('#qualification').val(data.qualification || '');
        $('#occupation').val(data.occupation || '');
        $('#otherinfo').val(data.otherinfo || '');
        $('#idproofnum').val(data.idproofnum || '');
        $('#selfpic_old').val(data.selfpic);
        $('#idproof_old').val(data.idproof);
        console.log("selfpic is ", data.selfpic, "idproof is ", data.idproof);
        if(data.selfpic) {
           $('#selfpic-preview').attr('src', data.selfpic).show();
        } else {
            $('#selfpic-preview').hide();
        }
        if(data.idproof) {
            $('#idproof-preview').attr('src', data.idproof).show();
        } else {
            $('#idproof-preview').hide();
        }
    }
    $(document).ready(function(){
        // Set email from sessionStorage
        const loggedInEmail = sessionStorage.getItem('loggedInEmail');
        if (loggedInEmail) {
            $('#email').val(loggedInEmail).prop('readonly', true);
        }
        // Image preview for selfpic
        $('#selfpic').on('change', function(e){
            const [file] = this.files;
            if (file) {
                console.log("photo changed");
                $('#selfpic-preview').attr('src', URL.createObjectURL(file)).show();
            } else {
                $('#selfpic-preview').hide();
            }
        });
        // Image preview for idproof
        $('#idproof').on('change', function(e){
            const [file] = this.files;
            if (file) {
                $('#idproof-preview').attr('src', URL.createObjectURL(file)).show();
            } else {
                $('#idproof-preview').hide();
            }
        });

        $('#registerBtn').click(function(){
            let formData = new FormData($('#volunteerForm')[0]);
            let obj = {
                type: 'POST',
                url: '/register-volunteer',
                data: formData,
                processData: false,
                contentType: false
            };
            $.ajax(obj)
            .then(function(res){
                console.log('Register response:', res);
                $('#msg').text(res.message || 'Registered!');
            }).fail(function(xhr){
                console.log('Register error:', xhr);
                $('#msg').text(xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Error');
            });
        });

        $('#updateBtn').click(function(){
            let formData = new FormData($('#volunteerForm')[0]);
            let obj = {
                type: 'POST',
                url: '/update-volunteer',
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

        $('#fetchBtn').click(function(){
            let email = $('#email').val();
            if(!email) return $('#msg').text('Enter email to fetch');
            let obj = {
                type: 'GET',
                url: '/fetch-volunteer',
                data: { email: email }
            };
            $.ajax(obj)
            .then(function(res){
                console.log('Fetch response:', res);
                let arr = Array.isArray(res) ? res : [res];
                if(arr.length === 0 || arr[0].email !== email) {
                    $('#msg').text('Profile not found!');
                    return;
                }
                // console.log("fetch response is ", JSON.stringify(arr));
                fillForm(arr[0]);
                $('#msg').text('Profile fetched!');
                // console.log("selfpic is ", arr[0].selfpic, "idproof is ", arr[0].idproof);
                $('#updateBtn').show();
            }).fail(function(xhr){
                console.log('Fetch error:', xhr);
                $('#msg').text(xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Not found');
            });
        });
    });