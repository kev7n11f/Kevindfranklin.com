# Kevindfranklin.com

Personal website for Kevin D Franklin - A modern, responsive website built with HTML, CSS, and JavaScript.

## About

This is a personal portfolio website featuring:
- Home page with hero section
- Bio/About page with personal information
- Contact page with form and contact information
- Responsive design that works on mobile, tablet, and desktop devices
- Clean, modern UI with gradient styling

## Live Website

The website is hosted at: [www.kevindfranklin.com](https://www.kevindfranklin.com)

## Viewing Locally

To view the website on your local machine:

### Option 1: Direct File Access
Simply open any of the HTML files in your web browser:
- `index.html` - Home page
- `bio.html` - Bio/About page
- `contact.html` - Contact page

### Option 2: Local Web Server (Recommended)
For the best experience and to test all features properly, use a local web server:

#### Using Python
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open your browser and navigate to: `http://localhost:8000`

#### Using Node.js
```bash
# Install http-server globally (one time)
npm install -g http-server

# Run server
http-server -p 8000
```

Then open your browser and navigate to: `http://localhost:8000`

#### Using PHP
```bash
php -S localhost:8000
```

Then open your browser and navigate to: `http://localhost:8000`

## Project Structure

```
Kevindfranklin.com/
├── index.html      # Home page
├── bio.html        # Biography/About page
├── contact.html    # Contact page
├── styles.css      # Main stylesheet for all pages
├── script.js       # JavaScript for contact form handling
├── CNAME           # Domain configuration for GitHub Pages
└── README.md       # This file
```

## Features

- **Responsive Design**: Works seamlessly on all device sizes
- **Modern UI**: Clean interface with gradient backgrounds and smooth transitions
- **Contact Form**: Functional contact form with validation
- **Easy Navigation**: Sticky header with navigation links
- **Customizable**: Easy to update content and styling

## Technologies Used

- HTML5
- CSS3 (with Flexbox and Grid)
- Vanilla JavaScript
- No frameworks or dependencies required

## Deployment

This website is configured for deployment on GitHub Pages:
1. The `CNAME` file configures the custom domain
2. GitHub Pages automatically serves the site from the repository
3. Any commits to the main branch will automatically update the live site

## Customization

To customize the website for your own use:

1. **Content**: Edit the HTML files to update text, links, and structure
2. **Styling**: Modify `styles.css` to change colors, fonts, and layout
3. **Contact Form**: Update the form handling in `script.js` to connect to your backend or email service
4. **Domain**: Update the `CNAME` file with your own domain name

## Browser Support

The website is compatible with all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

© 2025 Kevin D Franklin. All rights reserved.

## Contact

For any questions or inquiries, visit the [Contact page](https://www.kevindfranklin.com/contact.html) or email: contact@kevindfranklin.com