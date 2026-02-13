import React from 'react';
import useMobile from '../hooks/useMobile';
import KpiCarousel from './KpiCarousel';
import '../styles/tenant-luxury.css';

const SmartKpiContainer = ({ kpiItems }) => {
    // Breakpoint de 768px para tablet/desktop
    const isMobile = useMobile(768);

    if (isMobile) {
        return <KpiCarousel items={kpiItems} />;
    }

    return (
        <div className="indicator-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
        }}>
            {kpiItems.map((item, index) => (
                <div key={index} className="fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    {item}
                </div>
            ))}
        </div>
    );
};

export default SmartKpiContainer;
