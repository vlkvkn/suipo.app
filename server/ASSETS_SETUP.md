# Setting up assets.localhost subdomain

## What was done

1. **Created a separate assets server** on port 8001
2. **Configured static file serving** from the `uploads` folder
3. **Created nginx configuration file** for the subdomain

## How to configure

1. Install nginx if not already installed
2. Copy the `nginx-assets.conf` file to the nginx configuration folder:
   ```bash
   # Windows (if nginx is installed)
   copy nginx-assets.conf C:\nginx\conf\sites-available\
   
   # Linux/Mac
   sudo cp nginx-assets.conf /etc/nginx/sites-available/
   ```

3. Create a symbolic link:
   ```bash
   # Linux/Mac
   sudo ln -s /etc/nginx/sites-available/nginx-assets.conf /etc/nginx/sites-enabled/
   ```

4. Add an entry to the hosts file:
   ```
   # Windows: C:\Windows\System32\drivers\etc\hosts
   # Linux/Mac: /etc/hosts
   127.0.0.1 assets.localhost
   ```

5. Restart nginx:
   ```bash
   sudo nginx -s reload
   ```

## Usage

After configuration, your files from the `uploads` folder will be available at:

- `http://localhost:8000/uploads/file.jpg` (main server)
- `http://localhost:8001/file.jpg` (assets server)
- `http://assets.localhost/file.jpg` (via subdomain, if nginx is configured)

## Environment variables

Add to your `.env` file:
```
ASSETS_PORT=8001
```

## Testing

1. Start the server: `npm start`
2. Check availability:
   - `http://localhost:8001/health` - assets server status
   - `http://assets.localhost/health` - status via subdomain (if nginx is configured) 