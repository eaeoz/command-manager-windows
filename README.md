# CommandManager App

##### Download Windows Desktop App

[Installation File](https://drive.google.com/drive/folders/1Fw_sANe6mx-e9P2E3e_leCb6ssTtbbGt?usp=drive_link)

##### Set your display resolution and command timeout setting

- Display: default 1280x720 change proper value for your screen, Timeout: default 10 seconds and you can adjust type of command which you wait as response time (You can keep same profiles.json and commands.json config file names)

- `C:\Users\%USERNAME%\AppData\Local\CommandManager\resources\app\config\.env`

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
