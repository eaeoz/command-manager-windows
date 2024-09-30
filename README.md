# CommandManager App

##### Download Windows Desktop App

[Installation File](https://drive.google.com/drive/folders/1Fw_sANe6mx-e9P2E3e_leCb6ssTtbbGt?usp=drive_link)

##### Set your display resolution and command timeout setting

- Display: default 1280x720 change proper value for your screen, Timeout: default 10 seconds and you can adjust type of command your are waiting as response time (You can keep same profiles.json and commands.json config file names)

- `C:\Users\%USERNAME%\AppData\Local\CommandManager\resources\app\config\.env`

##### Edit your ssh host profiles using this file:

- `C:\Users\%USERNAME%\AppData\Local\CommandManager\resources\app\config\profiles.json`

##### config/profiles.json example ( you have to edit manually using correct values for your servers )

```
[
    {
        "title": "Profile 1",
        "username": "user1",
        "password": "password1",
        "host": "192.168.10.1",
        "port": 22
    },
    {
        "title": "Profile 2",
        "username": "user2",
        "password": "password2",
        "host": "192.168.10.2",
        "port": 22
    }
]
```

##### Run Application At The Path Below ( Installation will be add automatically create start and desktop shortcuts )

- `C:\Users\%USERNAME%\AppData\Local\CommandManager\command-manager.exe`

---

### To run on docker host:

[Instruction](https://hub.docker.com/r/eaeoz/command-manager-docker)

[Github Repo for Docker](https://github.com/eaeoz/command-manager-docker)

---

### (optional) You can run and test npm package as well

##### Install pkg globally

`sudo npm install -g pkg`

##### Install dependencies

`npm install`

##### Check node version to replace in package json 'node18-win-x64' if needed

`node -v`

##### Build

`npm run build`
