import styles from './Area2.module.scss';

export function Area2() {
  return (
    <section className={styles.area} id="area-2">
      <div className={styles.content}>
        <span className={styles.tag}>02</span>
        <h2 className={styles.heading}>Sed Do Eiusmod</h2>
        <p className={styles.body}>
          Excepteur sint occaecat cupidatat non proident, sunt in culpa
          qui officia deserunt mollit anim id est laborum. Duis aute irure
          dolor in reprehenderit in voluptate velit esse cillum dolore.
        </p>
      </div>
    </section>
  );
}
