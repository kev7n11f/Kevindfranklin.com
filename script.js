// Contact form handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // In a real application, you would send this data to a server
            // For now, we'll just show an alert and log to console
            console.log('Form submitted:', { name, email, subject, message });
            
            // Show success message
            let successMsg = document.getElementById('contact-success-message');
            if (!successMsg) {
                successMsg = document.createElement('div');
                successMsg.id = 'contact-success-message';
                successMsg.className = 'success-message';
                contactForm.parentNode.insertBefore(successMsg, contactForm.nextSibling);
            }
            successMsg.textContent = 'Thank you for your message! I will get back to you soon.';
            successMsg.style.display = 'block';
            
            // Optionally hide the message after 5 seconds
            setTimeout(function() {
                successMsg.style.display = 'none';
            }, 5000);
            
            // Reset form
            contactForm.reset();
        });
    }
});
