import { Link } from 'react-router';
import { Empty } from '../components/ui';
export default function NotFound(){return <Empty title="This page wandered off." description="Your next nail appointment is still out there." action={<Link to="/" className="button primary">Back to discovery</Link>}/>;}
