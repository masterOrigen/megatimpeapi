import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Modal, Form, Button } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faMoneyBill, faExpand, faPlay } from '@fortawesome/free-solid-svg-icons';
import MetricCard from './MetricCard';
import ChartComponent from './ChartComponent';
import { supabase } from '../config/supabaseClient';
import '../styles/Dashboard.css';

const Dashboard = () => {
	const [metrics, setMetrics] = useState({
		inversion: 0,
		medios: 0,
		soportes: 0
	});
	const [startDate, setStartDate] = useState('2024-12-31');
	const [endDate, setEndDate] = useState('');
	const [availableDates, setAvailableDates] = useState([]);
	const [mediaAgencyData, setMediaAgencyData] = useState([]);
	const [supportData, setSupportData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [productData, setProductData] = useState({
		byValue: [],
		byPublicValue: []
	});
	const [multimediaData, setMultimediaData] = useState([]);
	const [showVideoModal, setShowVideoModal] = useState(false);
	const [selectedVideo, setSelectedVideo] = useState(null);
	const [itemMediaTypes, setItemMediaTypes] = useState({});
	const [mediaType, setMediaType] = useState('unknown');
	const [pageLoading, setPageLoading] = useState(false);
	const [mediaLoading, setMediaLoading] = useState({});

	const LoadingOverlay = () => (
		<div style={{
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'rgba(255, 255, 255, 0.8)',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			zIndex: 1000
		}}>
			<Spinner animation="border" role="status">
				<span className="visually-hidden">Loading...</span>
			</Spinner>
		</div>
	);

	const checkMediaType = async (uuid) => {
		const mediaUrl = `https://multimedia.megatime.cl/file/spot/${uuid}?key=0af4d2525d183a8d6361a07a9aa35b26`;
		try {
			const response = await fetch(mediaUrl);
			const contentType = response.headers.get('content-type');
			return contentType?.includes('video') ? 'video' : 'image';
		} catch (error) {
			return 'unknown';
		}
	};

	const valueColumns = [
		{
			name: 'Producto',
			selector: row => row.product,
			sortable: true,
		},
		{
			name: 'Marca',
			selector: row => row.brand || '-',
			sortable: true,
		},
		{
			name: 'Valor',
			selector: row => row.value,
			sortable: true,
			format: row => Math.round(row.value).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
		},
	];

	const publicValueColumns = [
		{
			name: 'Producto',
			selector: row => row.product,
			sortable: true,
		},
		{
			name: 'Marca',
			selector: row => row.brand || '-',
			sortable: true,
		},
		{
			name: 'Valor Público',
			selector: row => row.value,
			sortable: true,
			format: row => Math.round(row.value).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
		},
	];

	const paginationComponentOptions = {
		rowsPerPageText: '',
		rangeSeparatorText: 'de',
		noRowsPerPage: true,
		selectAllRowsItem: false,
		firstText: '',
		previousText: 'Anterior',
		nextText: 'Siguiente',
		lastText: '',
		paginationRowsPerPageOptions: [15]
	};

	const noDataComponent = <div className="p-4">No hay registros para mostrar</div>;

	const multimediaColumns = [
		{
			name: 'Agencia de Medios',
			selector: row => row.media_agency || '-',
			sortable: true,
			wrap: true,
			minWidth: '200px',
		},
		{
			name: 'Agencia Creativa',
			selector: row => row.creative_agency || '-',
			sortable: true,
			wrap: true,
			minWidth: '200px',
		},
		{
			name: 'Multimedia',
			selector: row => row.uuid,
			sortable: false,
			width: '200px',
			style: {
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			},
			cell: row => {
				const mediaUrl = `https://multimedia.megatime.cl/file/spot/${row.uuid}?key=0af4d2525d183a8d6361a07a9aa35b26`;
				
				const handleClick = async () => {
					setSelectedVideo(row.uuid);
					setShowVideoModal(true);
					setMediaType(itemMediaTypes[row.uuid] || 'unknown');
				};

				return (
					<div style={{ width: '180px', padding: '5px', position: 'relative' }}>
						{(mediaLoading[row.uuid] || pageLoading) && (
							<div style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								backgroundColor: 'rgba(255, 255, 255, 0.8)',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								zIndex: 3
							}}>
								<Spinner animation="border" size="sm" />
							</div>
						)}
						<img 
							src={mediaUrl}
							alt="Media content"
							style={{ 
								width: '100%', 
								height: '100px', 
								objectFit: 'cover',
								cursor: 'pointer',
								borderRadius: '4px'
							}}
							onLoadStart={() => setMediaLoading(prev => ({ ...prev, [row.uuid]: true }))}
							onLoad={(e) => {
								setMediaLoading(prev => ({ ...prev, [row.uuid]: false }));
								if (e.target.naturalWidth === 1) {
									setItemMediaTypes(prev => ({ ...prev, [row.uuid]: 'video' }));
								} else {
									setItemMediaTypes(prev => ({ ...prev, [row.uuid]: 'image' }));
								}
							}}
							onError={(e) => {
								setMediaLoading(prev => ({ ...prev, [row.uuid]: false }));
								e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
								e.target.style.backgroundColor = '#000';
								setItemMediaTypes(prev => ({ ...prev, [row.uuid]: 'video' }));
							}}
							onClick={handleClick}
						/>
						<div 
							style={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%)',
								backgroundColor: 'rgba(0,0,0,0.5)',
								borderRadius: '50%',
								padding: '10px',
								cursor: 'pointer',
								zIndex: 2
							}}
							onClick={handleClick}
						>
							<FontAwesomeIcon 
								icon={itemMediaTypes[row.uuid] === 'video' ? faPlay : faExpand} 
								color="white" 
								size="lg" 
							/>
						</div>
					</div>
				);

			}


		},
		{
			name: 'Fecha',
			selector: row => row.date,
			sortable: true,
			wrap: true,
			minWidth: '120px',
			format: row => new Date(row.date).toLocaleDateString('es-CL')
		},
		{
			name: 'Primera Aparición',
			selector: row => row.ad_first_appearance,
			sortable: true,
			wrap: true,
			minWidth: '120px',
			format: row => new Date(row.ad_first_appearance).toLocaleDateString('es-CL')
		},
		{
			name: 'Hora',
			selector: row => `${row.hour || ''}${row.minute || ''}${row.second || ''}`,
			sortable: true,
			wrap: true,
			minWidth: '100px',
			cell: row => (
				<span>
					{row.hour || ''}:{row.minute || ''}:{row.second || ''}
				</span>
			)
		},
		{
			name: 'Duración',
			selector: row => row.duration,
			sortable: true,
			wrap: true,
			minWidth: '100px',
			format: row => `${row.duration} seg.`
		},
		{
			name: 'Valor',
			selector: row => row.value,
			sortable: true,
			wrap: true,
			minWidth: '180px',
			format: row => Math.round(row.value).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
		},
		{
			name: 'Calidad',

			selector: row => row.quality || '-',
			sortable: true,
			wrap: true,
			minWidth: '120px'
		},
		{
			name: 'Categoría',
			selector: row => row.category || '-',
			sortable: true,
			wrap: true,
			minWidth: '180px',
		},
		{
			name: 'Industria',
			selector: row => row.industry || '-',
			sortable: true,
			wrap: true,
			minWidth: '180px',
		}
	];

	const customStyles = {
		table: {
			style: {
				backgroundColor: 'transparent',
				marginBottom: '0',
			},
		},
		rows: {
			style: {
				minHeight: '85px',
				fontSize: '14px',
				padding: '16px 8px',
				marginTop: '8px',
			},
		},
		headRow: {
			style: {
				backgroundColor: '#f8f9fa',
				borderTopStyle: 'solid',
				borderTopWidth: '1px',
				borderTopColor: '#dee2e6',
				minHeight: '56px',
			},
		},
		headCells: {
			style: {
				padding: '16px 8px',
				fontWeight: 'bold',
				whiteSpace: 'normal',
				fontSize: '14px',
				lineHeight: '1.2',
			},
		},
		cells: {
			style: {
				padding: '16px 8px',
				whiteSpace: 'normal',
				wordBreak: 'break-word',
				fontSize: '14px',
				lineHeight: '1.5',
			},
		},
		pagination: {
			style: {
				borderTopStyle: 'none',
				marginTop: '24px',
				paddingTop: '24px',
				display: 'flex',
				justifyContent: 'center',
			},
		},
	};

	const commonDataTableProps = {
		pagination: true,
		responsive: true,
		highlightOnHover: true,
		striped: true,
		dense: false,
		paginationPerPage: 15,
		paginationRowsPerPageOptions: [15],
		noRowsPerPage: true,
		fixedHeader: false,
		customStyles: customStyles,
		paginationComponentOptions: paginationComponentOptions,
		noDataComponent: noDataComponent
	};

	const chartData = {
		labels: mediaAgencyData.map(([agency]) => agency),
		datasets: [{
			label: 'Número de Soportes',
			data: mediaAgencyData.map(([, count]) => count),
			backgroundColor: [
				'#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FF9F40',
				'#9966FF', '#FF99CC', '#99CCFF', '#FFCC99', '#99FF99'
			]
		}]
	};

	const soportesData = {
		labels: supportData.map(([support]) => support),
		datasets: [{
			label: 'Número de Productos',
			data: supportData.map(([, count]) => count),
			backgroundColor: [
				'#FF9F40', '#4BC0C0', '#9966FF', '#FF6384', '#36A2EB',
				'#FFCE56', '#FF99CC', '#99CCFF', '#FFCC99', '#99FF99'
			]
		}]
	};

	const convertDateFormat = (dateStr) => {
		if (!dateStr) return '';
		const [day, month, year] = dateStr.split('/');
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	};

	const clearAllData = () => {
		setMediaAgencyData([]);
		setSupportData([]);
		setMetrics({
			inversion: 0,
			medios: 0,
			soportes: 0
		});
		setProductData({
			byValue: [],
			byPublicValue: []
		});
		setMultimediaData([]);
	};

	const processAndUpdateData = (mediaData) => {
		const agencyData = {};
		const supportData = {};
		let totalInversion = 0;
		let totalPublicValue = 0;
		const productData = {};

		// Procesar datos multimedia
		const multimediaItems = mediaData.map(item => ({
			media_agency: item.media_agency || 'Sin agencia',
			creative_agency: item.creative_agency || 'Sin agencia creativa',
			uuid: item.uuid || '',
			date: item.date || '',
			ad_first_appearance: item.ad_first_appearance || '',
			hour: item.hour || '',
			minute: item.minute || '',
			second: item.second || '',
			duration: item.duration || '',
			value: parseFloat(item.value) || 0,
			quality: item.quality || '',
			category: item.category || '',
			industry: item.industry || ''
		}));

		mediaData.forEach(item => {
			const media = item.media || 'Sin medio';
			const support = item.support || 'Sin soporte';
			const product = item.product || 'Sin producto';
			const inversion = parseFloat(item.value) || 0;
			const publicValue = parseFloat(item.public_value) || 0;

			// Procesar agencias de medios
			if (!agencyData[media]) {
				agencyData[media] = { count: 0, inversion: 0 };
			}
			agencyData[media].count += 1;
			agencyData[media].inversion += inversion;

			// Procesar soportes
			if (!supportData[support]) {
				supportData[support] = { count: 0, productos: new Set() };
			}
			supportData[support].count += 1;
			if (product) {
				supportData[support].productos.add(product);
			}

			// Acumular totales
			totalInversion += inversion;
			totalPublicValue += publicValue;

			// Procesar productos
			if (!productData[product]) {
				productData[product] = {
					brand: item.brand || 'Sin marca',
					value: 0,
					public_value: 0
				};
			}
			productData[product].value += inversion;
			productData[product].public_value += publicValue;
		});

		const processedMediaData = Object.entries(agencyData)
			.map(([agency, data]) => [agency, data.count])
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);

		const processedSupportData = Object.entries(supportData)
			.map(([support, data]) => [support, data.productos.size])
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);

		// Procesar productos por value y public_value
		const productsByValue = Object.entries(productData)
			.map(([product, data]) => ({
				product,
				brand: data.brand,
				value: data.value
			}))
			.sort((a, b) => b.value - a.value)
			.slice(0, 20);

		const productsByPublicValue = Object.entries(productData)
			.map(([product, data]) => ({
				product,
				brand: data.brand,
				value: data.public_value
			}))
			.sort((a, b) => b.value - a.value)
			.slice(0, 20);

		// Actualizar estados
		setMediaAgencyData(processedMediaData);
		setSupportData(processedSupportData);
		setMetrics({
			inversion: totalInversion,
			medios: totalPublicValue,
			soportes: Object.keys(supportData).length
		});
		setProductData({
			byValue: productsByValue,
			byPublicValue: productsByPublicValue
		});
		setMultimediaData(multimediaItems);
	};

	const handleFilterByDate = async () => {
		setLoading(true);
		try {
			// Si no hay fecha seleccionada o está en la opción por defecto, cargar todos los datos
			if (!startDate || !endDate || endDate === "Seleccione una fecha") {
				console.log('Cargando todos los datos sin filtro de fecha...');
				const { data: mediaData, error: mediaError } = await supabase
					.from('SpotsEnero')
					.select(`
						media, support, value, product, brand, public_value, date,
						media_agency, creative_agency, uuid, ad_first_appearance,
						hour, minute, second, duration, quality, category, industry
					`)
					.abortSignal(new AbortController().signal);

				if (mediaError) {
					console.error('Error en la consulta:', mediaError);
					throw mediaError;
				}

				if (!mediaData || mediaData.length === 0) {
					console.log('No se encontraron datos');
					clearAllData();
					return;
				}

				console.log('Datos recibidos:', mediaData.length, 'registros');
				processAndUpdateData(mediaData);
				return;
			}

			// Si hay fechas seleccionadas, aplicar el filtro
			const formattedStartDate = startDate.split('/').reverse().join('-');
			const formattedEndDate = endDate.split('/').reverse().join('-');
			
			console.log('Filtrando datos entre:', formattedStartDate, 'y', formattedEndDate);
			
			const { data: mediaData, error: mediaError } = await supabase
				.from('SpotsEnero')
				.select(`
					media, support, value, product, brand, public_value, date,
					media_agency, creative_agency, uuid, ad_first_appearance,
					hour, minute, second, duration, quality, category, industry
				`)
				.gte('date', formattedStartDate)
				.lte('date', formattedEndDate)
				.abortSignal(new AbortController().signal);

			if (mediaError) {
				console.error('Error en la consulta:', mediaError);
				throw mediaError;
			}

			if (!mediaData || mediaData.length === 0) {
				console.log('No se encontraron datos para el rango de fechas seleccionado');
				clearAllData();
				return;
			}

			console.log('Datos filtrados recibidos:', mediaData.length, 'registros');
			processAndUpdateData(mediaData);

		} catch (error) {
			console.error('Error al filtrar datos:', error);
			alert('Error al filtrar los datos. Por favor intente nuevamente.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const fetchDates = async () => {
			try {
				console.log('Obteniendo fechas disponibles...');
				const { data, error } = await supabase
					.from('SpotsEnero')
					.select('date')
					.not('date', 'is', null)
					.order('date', { ascending: true });
				
				if (error) {
					console.error('Error al obtener fechas:', error);
					throw error;
				}
				
				if (data && data.length > 0) {
					const uniqueDates = [...new Set(data
						.map(item => item.date)
						.filter(date => {
							// Solo incluir fechas de 2025
							return date && 
								   date.trim() !== '' && 
								   date.startsWith('2025-');
						})
					)].sort();
					
					console.log('Fechas disponibles de 2025:', uniqueDates);
					setAvailableDates(uniqueDates);
				}
			} catch (error) {
				console.error('Error al obtener fechas:', error);
			}
		};
		
		fetchDates();
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				console.log('Cargando datos iniciales...');

				const { data: mediaData, error: mediaError } = await supabase
					.from('SpotsEnero')
					.select(`
						media, support, value, product, brand, public_value,
						media_agency, creative_agency, uuid, date, ad_first_appearance,
						hour, minute, second, duration, quality, category, industry
					`)
					.abortSignal(new AbortController().signal);

				if (mediaError) throw mediaError;

				if (mediaData) {
					console.log('Datos recibidos:', mediaData.length, 'registros');
					processAndUpdateData(mediaData);
				}
			} catch (error) {
				console.error('Error al cargar datos:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	return (
		<Container fluid className="dashboard-container">
			<Row className="mb-4">
				<Col>
					<h2 className="dashboard-title">
						Dashboard
						<div className="d-inline-flex align-items-center ms-3">
						<Form.Group className="me-3">  
  <Form.Control  
    type="text"  
    value={startDate}  
    readOnly  
  />  
</Form.Group>
							<Form.Group className="me-3">
								
								<Form.Select
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
								>
									<option value="">Seleccione una fecha</option>
									{availableDates && availableDates.length > 0 ? (
										availableDates.map(date => (
											<option key={date} value={date}>
												{date}
											</option>
										))
									) : (
										<option value="" disabled>Cargando fechas...</option>
									)}
								</Form.Select>
							</Form.Group>
							<Button 
								variant="primary"
								onClick={handleFilterByDate}
								disabled={!startDate || !endDate || loading}
								className="mt-4 abajo"
							>
								{loading ? (
									<>
										<Spinner
											as="span"
											animation="border"
											size="sm"
											role="status"
											aria-hidden="true"
											className="me-2"
										/>
										Filtrando...
									</>
								) : (
									'Filtrar'
								)}
							</Button>
						</div>
					</h2>
				</Col>
			</Row>
			<Row className="g-4 mb-4">
				<Col md={4}>
					<MetricCard 
						title="Value Total"
						value={loading ? <Spinner animation="border" size="sm" /> : Math.round(metrics.inversion).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
						icon={<FontAwesomeIcon icon={faMoneyBill} />}
					/>
				</Col>
				<Col md={4}>
					<MetricCard 
						title="PUBLIC VALUE"
						value={loading ? <Spinner animation="border" size="sm" /> : Math.round(metrics.medios).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
						icon={<FontAwesomeIcon icon={faChartLine} />}
					/>
				</Col>
				<Col md={4}>
					<MetricCard 
						title="TOTAL SOPORTES"
						value={loading ? <Spinner animation="border" size="sm" /> : `${metrics.soportes}`}
						icon={<FontAwesomeIcon icon={faUsers} />}
					/>
				</Col>
			</Row>
			<Row className="g-4">
				<Col md={6}>
					<ChartComponent 
						title="AGENCIAS DE MEDIOS" 
						data={chartData}
						className="chart-container" 
						type="bar"
						loading={loading}
					/>
				</Col>
				<Col md={6}>
					<ChartComponent 
						title="TOP 10 SOPORTES POR PRODUCTOS" 
						data={soportesData}
						className="chart-container"
						type="doughnut"
						loading={loading}
					/>
				</Col>
			</Row>
			<Row className="g-4 mt-2">
				<Col md={12}>
					<Card className="h-100 shadow-sm section-card">
						<Card.Body style={{ padding: '24px' }}>
							<Card.Title className="section-title">Inversión por producto</Card.Title>
							{loading ? (
								<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
									<Spinner animation="border" role="status">
										<span className="visually-hidden">Loading...</span>
									</Spinner>
								</div>
							) : (
								<Row>
									<Col md={6}>

										<h5 className="text-center mb-3">Top 20 por Value</h5>
										<DataTable
											{...commonDataTableProps}
											columns={valueColumns}
											data={productData.byValue}
										/>



									</Col>
									<Col md={6}>
										<h5 className="text-center mb-3">Top 20 por Public Value</h5>
										<DataTable
											{...commonDataTableProps}
											columns={publicValueColumns}
											data={productData.byPublicValue}
										/>


									</Col>
								</Row>
							)}
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<Row className="g-4 mt-2">
				<Col md={12}>
					<Card className="h-100 shadow-sm section-card bajo" style={{ position: 'relative' }}>
						<Card.Body style={{ padding: '24px' }}>
							<Card.Title className="section-title">Multimedia</Card.Title>
							{(loading || pageLoading) && <LoadingOverlay />}
							<DataTable
								{...commonDataTableProps}
								columns={multimediaColumns}
								data={multimediaData}
								progressPending={loading}
								progressComponent={
									<div className="p-4">
										<Spinner animation="border" role="status">
											<span className="visually-hidden">Cargando...</span>
										</Spinner>
									</div>
								}
								onChangePage={() => {
									setPageLoading(true);
									setTimeout(() => {
										setPageLoading(false);
										setMediaLoading({});
									}, 1000);
								}}
							/>



						</Card.Body>
					</Card>
				</Col>
			</Row>
			<Modal
				show={showVideoModal}
				onHide={() => setShowVideoModal(false)}
				size="xl"
				centered
				dialogClassName="video-modal"
			>
				<Modal.Header closeButton>
					<Modal.Title>Contenido Multimedia</Modal.Title>
				</Modal.Header>
				<Modal.Body className="p-0 bg-dark">
					{selectedVideo && (
						<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
							{(mediaType === 'video' || itemMediaTypes[selectedVideo] === 'video') ? (
								<video
									src={`https://multimedia.megatime.cl/file/spot/${selectedVideo}?key=0af4d2525d183a8d6361a07a9aa35b26`}
									controls
									autoPlay
									style={{ maxWidth: '100%', maxHeight: '80vh' }}
								/>
							) : (
								<img
									src={`https://multimedia.megatime.cl/file/spot/${selectedVideo}?key=0af4d2525d183a8d6361a07a9aa35b26`}
									alt="Media content"
									style={{ 
										maxWidth: '100%', 
										maxHeight: '80vh',
										objectFit: 'contain' 
									}}
								/>
							)}
						</div>
					)}

				</Modal.Body>

			</Modal>
		</Container>
	);
};

export default Dashboard;