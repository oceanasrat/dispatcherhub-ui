export const fmtMoney = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return "$0.00";
  return x.toLocaleString(undefined, { style: "currency", currency: "USD" });
};
