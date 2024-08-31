import requests

# Your Telegram bot token
BOT_TOKEN = '6659754838:AAFXlmSjf1Ftu1tGG4I76saR_KyQ_NnWY_I'

# The Telegram API URL for sending messages
telegram_api_url = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'

# The user ID to send the message to
user_id = '7116003536'  # Replace with your Telegram ID

# The message you want to send
message_text = "https://t.me/lotterytoncoinbeta_bot/TonLotteryBeta"

# Sending the message
response = requests.post(telegram_api_url, data={
    'chat_id': user_id,
    'text': message_text
})

# Print the response for debugging
print(response.status_code)
print(response.json())