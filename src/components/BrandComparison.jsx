import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faMoneyBill, faArrowLeft, faFilePdf, faRobot } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../config/supabaseClient';
import MetricCard from './MetricCard';
import ChartComponent from './ChartComponent';
import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';

const BrandComparison = () => {
    const { brands } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [brandsData, setBrandsData] = useState([]);

    useEffect(() => {
        const fetchBrandsData = async () => {
            try {
                const brandsList = decodeURIComponent(brands).split(',');
                const brandsPromises = brandsList.map(brand =>
                    supabase
                        .from('SpotsEnero')
                        .select('*')
                        .ilike('brand', `%${brand}%`)
                );

                const results = await Promise.all(brandsPromises);
                const processedData = results.map((result, index) => {
                    if (result.error) throw result.error;

                    const data = result.data;
                    const valueTotal = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
                    const publicValue = data.reduce((sum, item) => sum + (Number(item.public_value) || 0), 0);
                    const uniqueSupports = new Set(data.map(item => item.support)).size;

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
                    const mediaAgencyData = Object.entries(mediaAgencyCounts)
                        .map(([agency, supports]) => [agency, supports.size])
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10);

                    // Process support data
                    const supportCounts = {};
                    data.forEach(item => {
                        if (item.support) {
                            supportCounts[item.support] = (supportCounts[item.support] || 0) + 1;
                        }
                    });

                    // Get top 10 supports
                    const supportData = Object.entries(supportCounts)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10);

                    return {
                        brand: brandsList[index],
                        metrics: {
                            valueTotal,
                            publicValue,
                            totalSoportes: uniqueSupports
                        },
                        mediaAgencyData,
                        supportData
                    };
                });

                setBrandsData(processedData);
            } catch (error) {
                console.error('Error fetching brands data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBrandsData();
    }, [brands]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        let yPos = 20;
        const lineHeight = 10;
        
        brandsData.forEach((brandData, index) => {
            // Add brand name as header
            doc.setFontSize(16);
            doc.text(brandData.brand, 20, yPos);
            yPos += lineHeight * 2;
            
            // Add metrics
            doc.setFontSize(12);
            doc.text(`VALUE TOTAL: ${Math.round(brandData.metrics.valueTotal).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}`, 20, yPos);
            yPos += lineHeight;
            doc.text(`PUBLIC VALUE: ${Math.round(brandData.metrics.publicValue).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}`, 20, yPos);
            yPos += lineHeight;
            doc.text(`TOTAL SOPORTES: ${brandData.metrics.totalSoportes}`, 20, yPos);
            yPos += lineHeight * 2;
            
            // Add media agencies section
            doc.setFontSize(14);
            doc.text('AGENCIAS DE MEDIOS', 20, yPos);
            yPos += lineHeight;
            doc.setFontSize(12);
            brandData.mediaAgencyData.forEach(([agency, count]) => {
                doc.text(`${agency}: ${count} soportes`, 30, yPos);
                yPos += lineHeight;
            });
            yPos += lineHeight;
            
            // Add supports section
            doc.setFontSize(14);
            doc.text('TOP 10 SOPORTES', 20, yPos);
            yPos += lineHeight;
            doc.setFontSize(12);
            brandData.supportData.forEach(([support, count]) => {
                doc.text(`${support}: ${count} productos`, 30, yPos);
                yPos += lineHeight;
            });
            
            // Add page break if not the last brand
            if (index < brandsData.length - 1) {
                doc.addPage();
                yPos = 20;
            }
        });
        
        doc.save('comparacion-marcas.pdf');
    };


    return (
        <Container fluid>
            <Row className="mb-4 align-items-center">
                <Col className='alineado d-flex justify-content-between align-items-center'>
                    <div>
                        <Button 
                            variant="outline-primary" 
                            onClick={() => navigate(-1)}
                            className="me-3"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                            Volver
                        </Button>
                        <h2 className="d-inline-block mb-0">Estas comparando marcas</h2>
                    </div>
                    <div>

                        <Button 
                            variant="success" 
                            onClick={handleExportPDF}
                            disabled={loading}
                            className="me-2"
                        >
                            <FontAwesomeIcon icon={faFilePdf} className="me-2" />
                            Exportar a PDF
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={() => navigate('/pdf-analysis')}
                            disabled={loading}
                        >
                            <FontAwesomeIcon icon={faRobot} className="me-2" />
                            Analizar PDF con IA
                        </Button>
                    </div>
                </Col>
            </Row>

            {loading ? (
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                </div>
            ) : (
                <div id="comparison-content" className="pdf-export">
                    <style>
                        {`
                            @media print {
                                .pdf-export h3 { font-size: 14px !important; }
                                .pdf-export .card-title { font-size: 10px !important; }
                                .pdf-export .metric-value { font-size: 12px !important; }
                                .pdf-export .chart-title { font-size: 10px !important; }
                                .pdf-export .chart-container { height: 180px !important; }
                                .pdf-export .fa-icon { font-size: 12px !important; }
                                .pdf-export .metric-card-icon { 
                                    font-size: 14px !important;
                                    color: #000 !important;
                                    opacity: 1 !important;
                                }
                                .pdf-export .card { 
                                    margin-bottom: 10px !important;
                                    padding: 8px !important;
                                }
                            }
                        `}
                    </style>
                    {brandsData.map((brandData, index) => (
                        <div key={index} className="mb-5">
                            <h3 className="mb-4 thetitulox">{brandData.brand}</h3>
                            <Row className="g-4 mb-4">
                                <Col md={4}>
                                    <MetricCard 
                                        title="VALUE TOTAL"
                                        value={Math.round(brandData.metrics.valueTotal).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
                                        icon={<FontAwesomeIcon icon={faMoneyBill} />}
                                    />
                                </Col>
                                <Col md={4}>
                                    <MetricCard 
                                        title="PUBLIC VALUE"
                                        value={Math.round(brandData.metrics.publicValue).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
                                        icon={<FontAwesomeIcon icon={faChartLine} />}
                                    />
                                </Col>
                                <Col md={4}>
                                    <MetricCard 
                                        title="TOTAL SOPORTES"
                                        value={brandData.metrics.totalSoportes}
                                        icon={<FontAwesomeIcon icon={faUsers} />}
                                    />
                                </Col>
                            </Row>
                            <Row className="g-4 mb-4">
                                <Col md={6}>
                                    <ChartComponent 
                                        title="AGENCIAS DE MEDIOS" 
                                        data={{
                                            labels: brandData.mediaAgencyData.map(([agency]) => agency),
                                            datasets: [{
                                                label: 'Número de Soportes',
                                                data: brandData.mediaAgencyData.map(([, count]) => count),
                                                backgroundColor: [
                                                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FF9F40',
                                                    '#9966FF', '#FF99CC', '#99CCFF', '#FFCC99', '#99FF99'
                                                ]
                                            }]
                                        }} 
                                        type="bar"
                                    />
                                </Col>
                                <Col md={6}>
                                    <ChartComponent 
                                        title="TOP 10 SOPORTES" 
                                        data={{
                                            labels: brandData.supportData.map(([support]) => support),
                                            datasets: [{
                                                data: brandData.supportData.map(([, count]) => count),
                                                backgroundColor: [
                                                    '#FF9F40', '#4BC0C0', '#9966FF', '#FF6384', '#36A2EB',
                                                    '#FFCE56', '#FF99CC', '#99CCFF', '#FFCC99', '#99FF99'
                                                ]
                                            }]
                                        }}
                                        type="doughnut"
                                    />
                                </Col>
                            </Row>
                        </div>
                    ))}
                </div>
            )}
        </Container>
    );
};

export default BrandComparison;