import styles from './CalculationBox.module.css';

/** "Why the rule fired" (design 48): the exact calculation, written by the server from the numbers the rule saved. */
export function CalculationBox({ calculation }: { calculation: string }) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Why the rule fired</h2>
      <p className={styles.text}>{calculation}</p>
    </section>
  );
}
