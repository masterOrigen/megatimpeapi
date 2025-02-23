import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faMoneyBill, faArrowLeft, faPlay, faExpand } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../config/supabaseClient';
import DataTable from 'react-data-table-component';
import MetricCard from './MetricCard';
import ChartComponent from './ChartComponent';

const Brand = () => {
	const { brandName } = useParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [brandData, setBrandData] = useState([]);
	const [mediaAgencyData, setMediaAgencyData] = useState([]);
	const [supportData, setSupportData] = useState([]);
	const [multimediaData, setMultimediaData] = useState([]);
	const [showVideoModal, setShowVideoModal] = useState(false);
	const [selectedVideo, setSelectedVideo] = useState(null);
	const [itemMediaTypes, setItemMediaTypes] = useState({});
	const [mediaType, setMediaType] = useState('unknown');
	const [mediaLoading, setMediaLoading] = useState({});
	const [metrics, setMetrics] = useState({
		valueTotal: 0,
		publicValue: 0,
		totalSoportes: 0
	});

	useEffect(() => {
		const fetchBrandData = async () => {
			try {
				const { data, error } = await supabase
					.from('SpotsEnero')
					.select('*, media_agency, creative_agency, uuid, ad_first_appearance, hour, minute, second, duration, value, quality, category, industry')
					.ilike('brand', `%${brandName}%`);

				if (error) throw error;
				setBrandData(data);
				setMultimediaData(data.filter(item => item.uuid)); // Filtrar solo los items con uuid

				// Calculate metrics
				const valueTotal = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
				const publicValue = data.reduce((sum, item) => sum + (Number(item.public_value) || 0), 0);
				const uniqueSupports = new Set(data.map(item => item.support)).size;

				setMetrics({
					valueTotal,
					publicValue,
					totalSoportes: uniqueSupports
				});

				// Process media agency data
				const mediaAgencyCounts = {};
				data.forEach(item => {
					if (item.media_agency) {
						if (!mediaAgencyCounts[item.media_agency]) {
							mediaAgencyCounts[item.media_agency] = new Set();
						}
						mediaAgencyCounts[item.media_agency].add(item.support);
					}
				});

				// Get top 10 media agencies
				const sortedAgencies = Object.entries(mediaAgencyCounts)
					.map(([agency, supports]) => [agency, supports.size])
					.sort(([,a], [,b]) => b - a)
					.slice(0, 10);

				setMediaAgencyData(sortedAgencies);

				// Process support data
				const supportCounts = {};
				data.forEach(item => {
					if (item.support) {
						supportCounts[item.support] = (supportCounts[item.support] || 0) + 1;
					}
				});

				// Get top 10 supports
				const sortedSupports = Object.entries(supportCounts)
					.sort(([,a], [,b]) => b - a)
					.slice(0, 10);

				setSupportData(sortedSupports);
			} catch (error) {
				console.error('Error fetching brand data:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchBrandData();
	}, [brandName]);

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
			data: supportData.map(([, count]) => count),
			backgroundColor: [
				'#FF9F40', '#4BC0C0', '#9966FF', '#FF6384', '#36A2EB',
				'#FFCE56', '#FF99CC', '#99CCFF', '#FFCC99', '#99FF99'
			]
		}]
	};

	const columns = [
		{
			name: 'Producto',
			selector: row => row.product,
			sortable: true,
		},
		{
			name: 'Marca',
			selector: row => row.brand,
			sortable: true,
		},
		{
			name: 'Valor',
			selector: row => row.value,
			sortable: true,
			format: row => Math.round(row.value).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })
		},
		{
			name: 'Soporte',
			selector: row => row.support,
			sortable: true,
		}
	];

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
						{mediaLoading[row.uuid] && (
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
			},
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
			name: 'Primera Aparación',
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
		},
		{
			name: 'Soporte',
			selector: row => row.support || '-',
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

	const paginationComponentOptions = {
		rowsPerPageText: 'Filas por página:',
		rangeSeparatorText: 'de',
		selectAllRowsItem: false,
		selectAllRowsItemText: 'Todos',
		noRowsPerPage: false,
		firstText: '',
		previousText: 'Anterior',
		nextText: 'Siguiente',
		lastText: '',
		paginationRowsPerPageOptions: [10, 20, 30, 40, 50]
	};

	return (
		<Container fluid>
			<Row className="mb-4 align-items-center">
				<Col className='alineado'>
					<Button 
						variant="outline-primary" 
						onClick={() => navigate('/')}
						className="me-3"
					>
						<FontAwesomeIcon icon={faArrowLeft} className="me-2" />
						Volver al Dashboard
					</Button>
					
				</Col>
			</Row>
			<Row className="g-4 mb-4">
				<Col md={4}>
					<MetricCard 
						title="VALUE TOTAL"
						value={loading ? <Spinner animation="border" size="sm" /> : Math.round(metrics.valueTotal).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
						icon={<FontAwesomeIcon icon={faMoneyBill} />}
					/>
				</Col>
				<Col md={4}>
					<MetricCard 
						title="PUBLIC VALUE"
						value={loading ? <Spinner animation="border" size="sm" /> : Math.round(metrics.publicValue).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
						icon={<FontAwesomeIcon icon={faChartLine} />}
					/>
				</Col>
				<Col md={4}>
					<MetricCard 
						title="TOTAL SOPORTES"
						value={loading ? <Spinner animation="border" size="sm" /> : metrics.totalSoportes}
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
						title="TOP 10 SOPORTES" 
						data={soportesData} 
						className="chart-container"
						type="doughnut"
						loading={loading}
					/>
				</Col>
			</Row>
			<Row className="mt-4">
				<Col>
					<Card>
						<Card.Body>
							<Card.Title>Datos de la Marca</Card.Title>
							{loading ? (
								<div className="text-center p-4">
									<Spinner animation="border" role="status">
										<span className="visually-hidden">Cargando...</span>
									</Spinner>
								</div>
							) : (
								<DataTable
									columns={columns}
									data={brandData}
									pagination
									responsive
									highlightOnHover
								/>
							)}
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<Row className="mt-4">
				<Col>
					<Card>
						<Card.Body>
							<Card.Title>Datos Multimedia</Card.Title>
							{loading ? (
								<div className="text-center p-4">
									<Spinner animation="border" role="status">
										<span className="visually-hidden">Cargando...</span>
									</Spinner>
								</div>
							) : (
								<DataTable
									columns={multimediaColumns}
									data={multimediaData}
									pagination
									responsive
									highlightOnHover
									customStyles={customStyles}
									paginationComponentOptions={paginationComponentOptions}
								/>
							)}
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<Modal
				show={showVideoModal}
				onHide={() => setShowVideoModal(false)}
				size="lg"
				aria-labelledby="contained-modal-title-vcenter"
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title id="contained-modal-title-vcenter">
						{mediaType === 'video' ? 'Video' : 'Imagen'}
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{mediaType === 'video' ? (
						<video 
							width="100%" 
							height="100%" 
							controls 
							autoPlay 
							poster={`https://multimedia.megatime.cl/file/spot/${selectedVideo}?key=0af4d2525d183a8d6361a07a9aa35b26`}
						>
							<source 
								src={`https://multimedia.megatime.cl/file/spot/${selectedVideo}?key=0af4d2525d183a8d6361a07a9aa35b26`} 
								type="video/mp4"
							/>
						</video>
					) : (
						<img 
							src={`https://multimedia.megatime.cl/file/spot/${selectedVideo}?key=0af4d2525d183a8d6361a07a9aa35b26`} 
							alt="Imagen" 
							width="100%" 
							height="100%"
						/>
					)}
				</Modal.Body>
			</Modal>
		</Container>
	);
};

export default Brand;