$(document).ready(function() {
    const loggedInEmail = sessionStorage.getItem('loggedInEmail');
    if (!loggedInEmail) {
        $('#msg').css('color', 'red').text('Please login to post a job.');
        return;
    }
    $('#clientid').val(loggedInEmail).prop('readonly', true);

    $('#publishBtn').click(function() {
        // Clear previous messages
        $('.error-message').hide();
        $('#msg').text('');
       

        // Collect form data
        const data = {
            clientid: $('#clientid').val(),
            jobtitle: $('#jobtitle').val(),
            jobtype: $('#jobtype').val(),
            firmaddress: $('#firmaddress').val(),
            city: $('#city').val(),
            education: $('input[name="education"]:checked').val(),
            contactperson: $('#contactperson').val()
        };

        // Basic validation (optional, for UX)
        let hasError = false;
        if (!data.jobtitle) { $('#error-jobtitle').show().text('Job title required'); hasError = true; }
        if (!data.jobtype) { $('#error-jobtype').show().text('Job type required'); hasError = true; }
        if (!data.firmaddress) { $('#error-firmaddress').show().text('Firm address required'); hasError = true; }
        if (!data.city) { $('#error-city').show().text('City required'); hasError = true; }
        if (!data.education) { $('#error-education').show().text('Education required'); hasError = true; }
        if (hasError) return;

        // Send AJAX request
        let obj = {
            url: '/post-job',
            type: 'POST',
            data: data
        };
        $.ajax(obj)
        .then(function(response) {
            if (response.success) {
                $('#msg').css('color', 'green').text(response.message);
                $('#jobForm')[0].reset();
                $('#clientid').val(loggedInEmail).prop('readonly', true);
            } else {
                $('#msg').css('color', 'red').text(response.error || 'Failed to post job.');
            }
        })
        .fail(function(xhr) {
            $('#msg').css('color', 'red').text(xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Server error.');
        });
    });
});