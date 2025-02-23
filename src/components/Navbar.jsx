import React, { useState } from 'react';
import { Navbar, Container, Button } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import DateRangeSelector from './DateRangeSelector';
import Buscador from './Buscador';
import Sidebar from './Sidebar';

const NavigationBar = () => {
	const location = useLocation();
	const [showSidebar, setShowSidebar] = useState(false);
	
	const handleDateChange = (start, end) => {
		console.log('Date range changed:', { start, end });
	};

	// Función para determinar el título del Navbar
	const getNavbarTitle = () => {
		if (location.pathname.includes('/brand/')) {
			// Extraer el nombre de la marca de la URL
			const brandName = location.pathname.split('/brand/')[1];
			return decodeURIComponent(brandName);
		}
		return 'DASHBOARD';
	};

	const isInBrandView = location.pathname.includes('/brand/');

	return (
		<>
			<Navbar bg="dark" variant="dark" className="mb-4 w-100">
				<Container fluid>
					<Navbar.Brand>{getNavbarTitle()}</Navbar.Brand>

					<div className="d-flex mx-auto position-relative" style={{ width: '40%' }}>
						<Buscador />
					</div>

					<div className="d-flex align-items-center gap-3">
						<DateRangeSelector onDateChange={handleDateChange} />
						{isInBrandView && (
							<Button 
								variant="outline-light" 
								onClick={() => setShowSidebar(true)}
							>
								<FontAwesomeIcon icon={faBars} />
							</Button>
						)}
					</div>
				</Container>
			</Navbar>

			<Sidebar show={showSidebar} handleClose={() => setShowSidebar(false)} />
		</>
	);
};

export default NavigationBar;