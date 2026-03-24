import { useState } from 'react';
import { useInput } from 'ink';

/**
 * useBossKey
 * 监听 Ctrl+B 快捷键，切换老板键（隐匿术）状态
 *
 * @param onHide 切换到伪装界面时的回调
 * @param onShow 从伪装界面恢复时的回调
 */
export function useBossKey(onHide: () => void, onShow: () => void): void {
  const [hidden, setHidden] = useState(false);

  useInput((input, key) => {
    if (key.ctrl && input.toLowerCase() === 'b') {
      if (hidden) {
        onShow();
        setHidden(false);
      } else {
        onHide();
        setHidden(true);
      }
    }
  });
}
