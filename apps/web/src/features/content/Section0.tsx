import styles from './Section0.module.scss';

export function Section0() {
  return (
    <section className={styles.area} id="section-0">
      <div className={styles.content}>
        <span className={styles.tag}>00</span>
        <h1 className={styles.hero}>
          Ipsum <em>Dolor</em>
        </h1>
        <p className={styles.subtitle}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
    </section>
  );
}
