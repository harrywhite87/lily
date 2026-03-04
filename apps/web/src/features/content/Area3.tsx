import styles from './Area3.module.scss';

export function Area3() {
  return (
    <section className={styles.area} id="area-3">
      <div className={styles.content}>
        <span className={styles.tag}>03</span>
        <h2 className={styles.heading}>Incididunt Ut Labore</h2>
        <p className={styles.body}>
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit
          aut fugit, sed quia consequuntur magni dolores eos qui ratione
          voluptatem sequi nesciunt.
        </p>
      </div>
    </section>
  );
}
