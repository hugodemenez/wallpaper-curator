"use client";

import { useEffect } from "react";
import { Toast } from "@/components/silk";
import styles from "./copy-toast.module.css";

type Props = {
  message: string | null;
  nonce: number;
};

function ToastPresenter({ message, nonce }: Props) {
  const present = Toast.usePresent();

  useEffect(() => {
    if (!message || nonce === 0) return;
    present(true);
  }, [message, nonce, present]);

  return (
    <Toast.Portal>
      <Toast.View>
        <Toast.Content>
          <div className={styles.root}>
            <Toast.Title className={styles.title}>Copied</Toast.Title>
            <Toast.Description className={styles.description}>
              {message ?? ""}
            </Toast.Description>
          </div>
        </Toast.Content>
      </Toast.View>
    </Toast.Portal>
  );
}

export function CopyToast({ message, nonce }: Props) {
  return (
    <Toast.Root>
      <ToastPresenter message={message} nonce={nonce} />
    </Toast.Root>
  );
}
