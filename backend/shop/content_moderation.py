# import logging
# from transformers import pipeline
# from django.core.exceptions import ValidationError

# logger = logging.getLogger(__name__)

# # Khởi tạo pipeline cho phát hiện nội dung độc hại
# try:
#     toxicity_classifier = pipeline("text-classification", model="unitary/toxic-bert", tokenizer="unitary/toxic-bert")
# except Exception as e:
#     logger.error(f"Failed to initialize toxicity classifier: {e}")
#     toxicity_classifier = None

# def check_content_violation(text):
#     """
#     Kiểm tra nội dung văn bản xem có chứa từ ngữ vi phạm hay không.
#     Trả về True nếu nội dung vi phạm, False nếu không.
#     """
#     if not toxicity_classifier:
#         logger.warning("Toxicity classifier not initialized. Skipping content check.")
#         return False

#     try:
#         # Kiểm tra nội dung
#         results = toxicity_classifier(text)
#         logger.info(f"Content check results: {results}")

#         # Kiểm tra các nhãn độc hại
#         for result in results:
#             if result['label'] in ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'] and result['score'] > 0.7:
#                 logger.warning(f"Content violation detected: {result['label']} with score {result['score']}")
#                 return True
#         return False
#     except Exception as e:
#         logger.error(f"Error checking content: {e}")
#         return False

# def validate_content(text):
#     """
#     Hàm kiểm tra nội dung và ném ngoại lệ nếu vi phạm.
#     """
#     if check_content_violation(text):
#         raise ValidationError("Nội dung chứa từ ngữ không phù hợp hoặc vi phạm chính sách.")

import logging
import json
import os
from transformers import pipeline
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

# Đường dẫn đến file JSON chứa danh sách từ khóa cấm
BLACKLIST_FILE = os.path.join(os.path.dirname(__file__), 'blacklist_words.json')

# Đọc danh sách từ khóa cấm từ file JSON
try:
    with open(BLACKLIST_FILE, 'r', encoding='utf-8') as f:
        BLACKLIST_WORDS = json.load(f).get('blacklist_words', [])
    logger.info(f"Loaded {len(BLACKLIST_WORDS)} blacklist words from {BLACKLIST_FILE}")
except FileNotFoundError:
    logger.error(f"Blacklist file not found: {BLACKLIST_FILE}")
    BLACKLIST_WORDS = []
except Exception as e:
    logger.error(f"Error loading blacklist file: {e}")
    BLACKLIST_WORDS = []

def check_blacklist(text):
    """
    Kiểm tra xem văn bản có chứa từ khóa bị cấm hay không.
    Trả về True nếu tìm thấy từ khóa, False nếu không.
    """
    if not BLACKLIST_WORDS:
        logger.warning("No blacklist words loaded. Skipping blacklist check.")
        return False
    text_lower = text.lower()
    for word in BLACKLIST_WORDS:
        if word in text_lower:
            logger.warning(f"Blacklisted word found: {word}")
            return True
    return False

# Khởi tạo pipeline cho phát hiện nội dung độc hại
try:
    toxicity_classifier = pipeline("text-classification", model="unitary/toxic-bert", tokenizer="unitary/toxic-bert")
except Exception as e:
    logger.error(f"Failed to initialize toxicity classifier: {e}")
    toxicity_classifier = None

def check_content_violation(text):
    """
    Kiểm tra nội dung văn bản xem có chứa từ ngữ vi phạm hay không.
    Trả về True nếu nội dung vi phạm, False nếu không.
    """
    # Kiểm tra từ khóa trước
    if check_blacklist(text):
        return True

    if not toxicity_classifier:
        logger.warning("Toxicity classifier not initialized. Skipping content check.")
        return False

    try:
        # Kiểm tra nội dung bằng mô hình
        results = toxicity_classifier(text)
        logger.info(f"Content check results: {results}")

        # Kiểm tra các nhãn độc hại
        for result in results:
            if result['label'] in ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'] and result['score'] > 0.7:
                logger.warning(f"Content violation detected: {result['label']} with score {result['score']}")
                return True
        return False
    except Exception as e:
        logger.error(f"Error checking content: {e}")
        return False

def validate_content(text):
    """
    Hàm kiểm tra nội dung và ném ngoại lệ nếu vi phạm.
    """
    if check_content_violation(text):
        raise ValidationError("Nội dung chứa từ ngữ không phù hợp hoặc vi phạm chính sách.")