const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const readline = require('readline');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Masukkan nama file kontak (misal: contacts.txt): ', (contactsFile) => {
    rl.question('Masukkan nama file pesan (misal: message.txt): ', (messageFile) => {
        rl.close();

        client.on('qr', (qr) => {
            qrcode.generate(qr, { small: true });
        });

        client.on('ready', () => {
            console.log('Client is ready!');

            fs.readFile(contactsFile, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading contacts file:', err);
                    return;
                }

                const contacts = data.split('\n').map(line => line.trim()).filter(line => line);
                fs.readFile(messageFile, 'utf8', async (err, message) => {
                    if (err) {
                        console.error('Error reading message file:', err);
                        return;
                    }

                    const sendMessages = async (chunk) => {
                        for (const contact of chunk) {
                            if (!/^\d{10,15}$/.test(contact)) {
                                console.error(`Invalid phone number format: ${contact}`);
                                continue;
                            }

                            const whatsappContact = `62${contact.substring(1)}@c.us`;
                            try {
                                const response = await client.sendMessage(whatsappContact, message);
                                console.log(`Message sent to ${whatsappContact}:`, response);
                            } catch (err) {
                                console.error(`Failed to send message to ${whatsappContact}:`, err);
                            }

                            const randomDelay = Math.floor(Math.random() * 10000) + 10000;
                            await new Promise(resolve => setTimeout(resolve, randomDelay));
                        }
                    };

                    const chunkSize = 5;
                    for (let i = 0; i < contacts.length; i += chunkSize) {
                        const chunk = contacts.slice(i, i + chunkSize);
                        await sendMessages(chunk);
                        await new Promise(resolve => setTimeout(resolve, 30000));
                    }
                });
            });
        });

        client.initialize();
    });
});