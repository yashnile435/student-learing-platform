
import { Outlet } from 'react-router-dom';
const AdminLayout = () => {
    return (
        <div className="admin-container container">
            <div className="admin-content">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
