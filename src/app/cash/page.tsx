"use client";
import React, { useState } from "react";
import { useRouter } from 'next/navigation'; // App Router에서는 'next/navigation'에서 가져옵니다.
import styles from "../cash/AmountInputPage.module.css"

const AmountInputPage = () => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (parseInt(amount) >= 3000) {
      try {
        // API 호출로 자동 로그인 처리
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "auto_user",
            password: "auto_pass",
          }),
        });

        const data = await response.json();
        if (data.success) {
          // 로그인 성공 시 주차 등록 페이지로 이동
          router.push(data.currentUrl);
        } else {
          setError("자동 로그인에 실패했습니다. 관리자에게 문의해주세요.");
        }
      } catch (error) {
        setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } else {
      setError("3000원 이상 결제해야 주차 등록이 가능합니다.");
    }
  };

  return (
    <div className={styles.container}>
      <img src="/path-to-logo.png" alt="Starbucks Logo" className={styles.logo}/>
      <h1 className={styles.title}>차량등록</h1>
      <p className={styles.subTitle}>별라면을 이용해주셔서 감사합니다.</p>
      
      <form onSubmit={handleSubmit} className={styles.form}>
      <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="결제 금액을 입력하세요"
          required
        />
        <button type="submit" className={styles.button}>
          차량등록하기
        </button>
      </form>
    </div>
  );
};

export default AmountInputPage;
