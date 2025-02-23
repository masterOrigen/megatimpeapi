import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faMoneyBill, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
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
					.select('*')
					.ilike('brand', `%${brandName}%`);

				if (error) throw error;
				setBrandData(data);

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
					<h2 className="d-inline-block mb-0">{brandName}</h2>
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
		</Container>
	);
};

export default Brand;