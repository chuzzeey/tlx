export default function OverviewLoading() {
  return (
    <div className='intel-overview' role='status' aria-label='Loading store intelligence' aria-busy='true'>
      <span className='sr-only'>Loading store intelligence…</span>
      <div className='intel-skeleton-heading'>
        <span className='intel-skeleton-line short' />
        <span className='intel-skeleton-line title' />
        <span className='intel-skeleton-line medium' />
      </div>
      <div className='intel-measures intel-glass intel-skeleton-measures' aria-hidden='true'>
        {Array.from({ length: 6 }, (_, index) => (
          <div className='intel-skeleton-measure' key={index}>
            <span className='intel-skeleton-line' />
            <span className='intel-skeleton-value' />
            <span className='intel-skeleton-line short' />
          </div>
        ))}
      </div>
      <div className='intel-skeleton-grid' aria-hidden='true'>
        {['wide', 'regular', 'regular', 'small', 'small', 'regular', 'regular', 'wide', 'small'].map((size, index) => (
          <div className={`intel-panel intel-skeleton-panel ${size}`} key={`${size}-${index}`}>
            <span className='intel-skeleton-line short' />
            <span className='intel-skeleton-line medium' />
            <span className='intel-skeleton-block' />
          </div>
        ))}
      </div>
    </div>
  );
}
