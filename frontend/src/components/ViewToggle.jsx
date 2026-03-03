import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

const ViewToggle = ({ viewMode, setViewMode }) => {
    return (
        <div className="view-toggle-bar">
            <button
                className={`btn-toggle-view ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Visualização em Cards"
                type="button"
            >
                <LayoutGrid size={18} />
            </button>
            <button
                className={`btn-toggle-view ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Tabela Compacta"
                type="button"
            >
                <List size={18} />
            </button>
        </div>
    );
};

export default ViewToggle;
