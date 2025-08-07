import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Navigation = () => {
  return (
    <div className="top-right-controls" style={{ position: "absolute", top: "1rem", right: "1rem", display: "flex", gap: "1rem" }}>
      <ConnectButton showBalance={false} chainStatus="name" accountStatus="address" />
    </div>
  );
};

export default Navigation;
