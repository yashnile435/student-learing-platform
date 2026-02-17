if not exist src\firebase mkdir src\firebase
if not exist src\hooks mkdir src\hooks
if not exist src\routes mkdir src\routes
if not exist src\assets mkdir src\assets
if exist src\firebase.js move src\firebase.js src\firebase\config.js
if exist src\services\paymentService.js move src\services\paymentService.js src\utils\paymentService.js
if exist src\services\progressService.js move src\services\progressService.js src\utils\progressService.js
if exist src\services rmdir /s /q src\services
