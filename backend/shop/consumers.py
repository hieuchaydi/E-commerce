from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from channels.db import database_sync_to_async
from shop.models import Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'chat_{user_id}'

        # Xác thực token
        token_key = self.scope['query_string'].decode().split('token=')[-1]
        try:
            token = await database_sync_to_async(Token.objects.filter(key=token_key).first)()
            if not token or str(token.user.id) != user_id:
                print(f"Authentication failed: token={token_key}, user_id={user_id}")
                await self.close()
                return
        except Exception as e:
            print(f"Token validation error: {str(e)}")
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"WebSocket connected: room={self.room_group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"WebSocket disconnected: room={self.room_group_name}, code={close_code}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')
        receiver_id = data.get('receiver_id')
        sender_id = data.get('sender_id')
        sender_username = data.get('sender_username')
        created_at = data.get('created_at')
        message_id = data.get('id')

        if not all([message, receiver_id, sender_id, sender_username, created_at]):
            print("Missing required fields in message data")
            return

        print(f"Received message: {message}, sender: {sender_id}, receiver: {receiver_id}")

        # Lưu tin nhắn vào database
        try:
            message_obj = await database_sync_to_async(lambda: Message.objects.create(
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=message,
                created_at=created_at
            ).full_clean())()
        except Exception as e:
            print(f"Failed to save message: {str(e)}")
            return

        # Gửi tin nhắn đến nhóm của receiver
        await self.channel_layer.group_send(
            f'chat_{receiver_id}',
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': sender_id,
                'sender_username': sender_username,
                'created_at': created_at,
                'id': message_obj.id,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'created_at': event['created_at'],
            'id': event['id'],
        }))