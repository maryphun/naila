import { index, route, type RouteConfig } from '@react-router/dev/routes';
export default [
  index('routes/explore.tsx'),
  route('services/:id','routes/service.tsx'),
  route('bookings','routes/bookings.tsx'),
  route('bookings/:id','routes/conversation.tsx'),
  route('messages','routes/messages.tsx'),
  route('account','routes/account.tsx'),
  route('join','routes/join.tsx'),
  route('merchant','routes/merchant.tsx'),
  route('merchant/calendar','routes/calendar.tsx'),
  route('merchant/business','routes/business.tsx'),
  route('admin','routes/admin.tsx'),
  route('*','routes/not-found.tsx'),
] satisfies RouteConfig;
