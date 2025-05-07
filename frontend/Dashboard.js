import React, { useContext, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await api.get(`/policies?userId=${user.id}`);
        setPolicies(response.data);
      } catch (error) {
        console.error('Error fetching policies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [user.id]);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="my-4">{t('welcome')}, {user.name}</h2>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>{t('yourPolicies')}</Card.Header>
            <Card.Body>
              {policies.length > 0 ? (
                policies.map(policy => (
                  <div key={policy.id} className="mb-3">
                    <h5>{policy.type} {t('coverage')}</h5>
                    <p>{t('amount')}: MWK {policy.coverage.toLocaleString()}</p>
                    <p>{t('premium')}: MWK {policy.premium.toLocaleString()} {t('perMonth')}</p>
                  </div>
                ))
              ) : (
                <p>{t('noPolicies')}</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;