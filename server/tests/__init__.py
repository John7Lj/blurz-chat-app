# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sys
import os
import pytest
import asyncio

# Add server dir to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
