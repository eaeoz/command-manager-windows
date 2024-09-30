# CommandManager App

##### Download Windows Desktop App

[Installation File](https://drive.google.com/drive/folders/1Fw_sANe6mx-e9P2E3e_leCb6ssTtbbGt?usp=drive_link)

##### Set your display resolution and command timeout setting

- Display: default 1280x720 change proper value for your screen
- Timeout: default 10 seconds, you can adjust type of command your are waiting as response time
- You don't need to change file names cuz its already provided and created for you.

- `C:\Users\%USERNAME%\AppData\Local\CommandManager\resources\app\config\.env`

##### Edit your ssh host profiles using this file:

- `C:\Users\%USERNAME%\AppData\Local\CommandManager\resources\app\config\profiles.json

##### Run Application At The Path Below

- `C:\Users\%USERNAME%\AppData\Local\CommandManager\command-manager.exe`

---

### To run on docker host:

[Instruction](https://hub.docker.com/r/eaeoz/command-manager-docker)

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
