
$(document).ready(function(){
    // Show modals using Bootstrap
    var loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    var signupModal = new bootstrap.Modal(document.getElementById('signupModal'));

    $('#openLogin').click(function(){ loginModal.show(); });
    $('#openSignup').click(function(){ signupModal.show(); });

    $('.close-modal').click(function(){
        loginModal.hide();
        signupModal.hide();
    });

    $('#signupForm, #loginForm').on('submit', function(e){ e.preventDefault(); });

    // Toggle password visibility for any .toggle-password button
    $(document).on('click', '.toggle-password', function(){
        const targetSel = $(this).attr('data-target');
        const $input = $(targetSel);
        if (!$input.length) return;
        const $icon = $(this).find('i');
        const isPassword = $input.attr('type') === 'password';
        $input.attr('type', isPassword ? 'text' : 'password');
        // swap icon
        if (isPassword) {
            $icon.removeClass('bi-eye').addClass('bi-eye-slash');
        } else {
            $icon.removeClass('bi-eye-slash').addClass('bi-eye');
        }
    });

    function clearPasswordField(selector) {
        const $inp = $(selector);
        $inp.val('');
        // ensure it is masked and icon reset if a toggle exists
        if ($inp.attr('type') !== 'password') $inp.attr('type', 'password');
        const $btn = $(`.toggle-password[data-target="${selector}"]`);
        const $icon = $btn.find('i');
        if ($icon.length) {
            $icon.removeClass('bi-eye-slash').addClass('bi-eye');
        }
    }

    // Signup AJAX
    $('#signupBtn').click(function(e){
        e.preventDefault();
        let obj = {
            type: 'POST',
            url: '/signup',
            data: {
                email: $('#signupEmail').val(),
                password: $('#signupPassword').val(),
                type: $('#signupType').val()
            }
        };
        $.ajax(obj)
        .then(function(res){
            if(res.success) {
                alert('Signup successful! Confirmation email sent.');
            } else {
                alert('Signup successful, but failed to send confirmation email.');
            }
            $('#signupMsg').text('Signup successful! Please log in.');
            // Clear password after successful signup
            clearPasswordField('#signupPassword');
        }).fail(function(xhr){
            let msg = xhr.responseJSON?.error || 'Signup failed';
            $('#signupMsg').text(msg);
        });
    });

    // Login AJAX
    $('#loginBtn').click(function(e){
        e.preventDefault();
        const email = $('#loginEmail').val().trim();
        const password = $('#loginPassword').val().trim();
        if (!email || !password) {
            $('#loginMsg').text('Please enter both email and password.');
            return;
        }
        let obj = {
            type: 'POST',
            url: '/login',
            data: { email: email, password: password }
        };
        $.ajax(obj)
        .then(function(res){
            sessionStorage.setItem('loggedInEmail', res.email);
            if (res.type) sessionStorage.setItem('userType', res.type);
            $('#loginMsg').text('Login successful!');
            // Clear password after successful login
            clearPasswordField('#loginPassword');
            setTimeout(function(){
                alert('Login successful! Redirecting to '+res.type+' dashboard.');
                if (res.type == 'volunteer') {
                    window.location.href = 'volunteerdashboard.html';
                } else if (res.type == 'client') {
                    window.location.href = 'clientdashboard.html';
                } else if (res.type == 'admin') {
                    window.location.href = 'admindashboard.html';
                } else {
                    alert('Redirecting to index page.');
                    window.location.href = 'index.html';
                }
            }, 2000);
        }).fail(function(xhr){
            let msg = xhr.responseJSON?.error || 'Login failed';
            $('#loginMsg').text(msg);
        });
    });
});
