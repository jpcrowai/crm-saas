import React from 'react';

const Skeleton = ({ width, height, borderRadius = 'var(--radius-md)', className = '' }) => {
    return (
        <div
            className={`skeleton-base ${className}`}
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius
            }}
        />
    );
};

export const KpiSkeleton = () => (
    <div className="indicator-card-luxury skeleton-card" style={{ height: '140px' }}>
        <Skeleton width="40px" height="40px" borderRadius="10px" className="mb-3" />
        <Skeleton width="60%" height="12px" className="mb-2" />
        <Skeleton width="40%" height="24px" />
    </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
    <div className="table-skeleton">
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="table-skeleton-row" style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Skeleton width="40px" height="40px" borderRadius="8px" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                    <Skeleton width="30%" height="12px" />
                    <Skeleton width="20%" height="10px" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Skeleton width="60px" height="24px" borderRadius="6px" />
                </div>
            </div>
        ))}
    </div>
);

export default Skeleton;
