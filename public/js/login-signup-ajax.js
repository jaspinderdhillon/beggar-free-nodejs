
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
