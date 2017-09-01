const page = require('./config/config.js').page;

const mailOptions = require('./config/config.js').mailOptions;
const mailgun = require('mailgun-js')(mailOptions);


const webd = require('selenium-webdriver');
//setup custom phantomJS capability
const phantomjs_exe = require('phantomjs-prebuilt').path;
const customPhantom = webd.Capabilities.phantomjs();
customPhantom.set("phantomjs.binary.path", phantomjs_exe);
//build custom phantomJS driver
const d = new webd.Builder()
        .withCapabilities(customPhantom)
        .build();

// resize browser to prevent click errors
d.manage().window().setSize(1920, 1080);
                       

const sendScreenshot = () => {
    let emailObject = mailOptions.emailObject;
    d.takeScreenshot()
        .then(base64String => {
            let imageBuffer = new Buffer(base64String, 'base64');
            let date = (new Date()).toString();
            let inline = new mailgun.Attachment({
                    data: imageBuffer,
                    filename: date,
                    contentType: 'image/png'
                }
            );
            emailObject.inline = inline;
        })
        .then(res => {
            console.log('Sending email');
            mailgun.messages().send(emailObject, function (error, body) {
                console.log(body);
            });
        });
}

/* 
* Main function
*/

d.get(page.url);
sendScreenshot();
d.quit();