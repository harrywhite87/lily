import styles from './Area1.module.scss';

export function Area1() {
  return (
    <section className={styles.area} id="area-1">
      <div className={styles.content}>
        <span className={styles.tag}>01</span>
        <h1 className={styles.hero}>
          Consectetur <em>Adipiscing</em>
        </h1>
        <p className={styles.body}>
          Ut enim ad minim veniam, quis nostrud exercitation ullamco
          laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </div>
    </section>
  );
}
