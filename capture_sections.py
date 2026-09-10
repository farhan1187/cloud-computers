import subprocess
import os

sections = ['hero', 'services', 'network', 'products', 'about', 'contact']
user_data = os.path.abspath('chrome_profile_capture')

for name in sections:
    url = f"http://localhost:8080/?section={name}" if name != 'hero' else "http://localhost:8080/?instant=true"
    out_file = os.path.abspath(f"view_{name}.png")
    cmd = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "--headless=new",
        f"--user-data-dir={user_data}",
        f"--screenshot={out_file}",
        "--window-size=1440,900",
        url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    size = os.path.getsize(out_file) if os.path.exists(out_file) else 0
    print(f"Captured {name}: {size} bytes")
