# MedChain ML — CNN Image Authenticity Verification

This directory contains research notes and training asset configurations for the MobileNetV2 counterfeit detection model.

## Overview
The vision component uses transfer learning with an ImageNet-pretrained **MobileNetV2** backbone (frozen) paired with a lightweight similarity classification head.

### Pipeline
1. **Dataset**: Dual image pairs of physical pharmaceutical packaging (genuine vs counterfeit samples).
2. **Preprocessing**:
   - Resize to 224x224
   - ImageNet normalization: `mean = [0.485, 0.456, 0.406]`, `std = [0.229, 0.224, 0.225]`
3. **Training Environment**: Google Colab (PyTorch / TensorFlow)
4. **Export**: Export trained weights to ONNX format (`model.onnx`).
5. **Inference**: Placed at `ml/model.onnx` or configured via `MODEL_PATH` in backend `.env`. Fast inference served by ONNX Runtime in FastAPI (`app/services/vision.py`).
