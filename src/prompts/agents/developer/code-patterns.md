# Code Patterns and Best Practices

## Design Patterns

<design_patterns>
### Singleton Pattern (TypeScript)
```typescript
class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: Record<string, any> = {};
  
  private constructor() {
    // Private constructor prevents instantiation
  }
  
  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }
  
  get<T>(key: string): T | undefined {
    return this.config[key] as T;
  }
  
  set(key: string, value: any): void {
    this.config[key] = value;
  }
}
```

### Factory Pattern
```typescript
interface PaymentProcessor {
  process(amount: number): Promise<PaymentResult>;
}

class StripeProcessor implements PaymentProcessor {
  async process(amount: number): Promise<PaymentResult> {
    // Stripe implementation
  }
}

class PayPalProcessor implements PaymentProcessor {
  async process(amount: number): Promise<PaymentResult> {
    // PayPal implementation
  }
}

class PaymentProcessorFactory {
  static create(type: 'stripe' | 'paypal'): PaymentProcessor {
    switch (type) {
      case 'stripe':
        return new StripeProcessor();
      case 'paypal':
        return new PayPalProcessor();
      default:
        throw new Error(`Unknown payment processor: ${type}`);
    }
  }
}
```

### Observer Pattern (Event-Driven)
```typescript
type EventHandler<T> = (data: T) => void;

class EventBus<Events extends Record<string, any>> {
  private handlers: Map<keyof Events, Set<EventHandler<any>>> = new Map();
  
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }
  
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    this.handlers.get(event)?.delete(handler);
  }
  
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.handlers.get(event)?.forEach(handler => handler(data));
  }
}

// Usage
interface AppEvents {
  userLoggedIn: { userId: string; timestamp: Date };
  orderCreated: { orderId: string; total: number };
}

const eventBus = new EventBus<AppEvents>();
```

### Strategy Pattern
```typescript
interface CompressionStrategy {
  compress(data: Buffer): Buffer;
  decompress(data: Buffer): Buffer;
}

class GzipStrategy implements CompressionStrategy {
  compress(data: Buffer): Buffer {
    // GZIP implementation
  }
  decompress(data: Buffer): Buffer {
    // GZIP decompression
  }
}

class BrotliStrategy implements CompressionStrategy {
  compress(data: Buffer): Buffer {
    // Brotli implementation
  }
  decompress(data: Buffer): Buffer {
    // Brotli decompression
  }
}

class FileCompressor {
  constructor(private strategy: CompressionStrategy) {}
  
  setStrategy(strategy: CompressionStrategy): void {
    this.strategy = strategy;
  }
  
  compressFile(filePath: string): Promise<void> {
    // Read file and use strategy to compress
  }
}
```
</design_patterns>

## React Patterns

<react_patterns>
### Custom Hooks for Business Logic
```typescript
// Encapsulate complex state and effects
function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchProfile() {
      try {
        setLoading(true);
        const data = await api.getUserProfile(userId);
        if (!cancelled) {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetchProfile();
    
    return () => {
      cancelled = true;
    };
  }, [userId]);
  
  return { profile, loading, error, refetch: () => fetchProfile() };
}
```

### Compound Components
```typescript
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export const Tabs = ({ children, defaultTab }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs-container">{children}</div>
    </TabsContext.Provider>
  );
};

Tabs.List = ({ children }: TabsListProps) => {
  return <div className="tabs-list" role="tablist">{children}</div>;
};

Tabs.Tab = ({ value, children }: TabProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');
  
  return (
    <button
      role="tab"
      aria-selected={context.activeTab === value}
      onClick={() => context.setActiveTab(value)}
      className={cn('tab', { active: context.activeTab === value })}
    >
      {children}
    </button>
  );
};

Tabs.Panel = ({ value, children }: TabPanelProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');
  
  if (context.activeTab !== value) return null;
  
  return (
    <div role="tabpanel" className="tab-panel">
      {children}
    </div>
  );
};
```

### Render Props Pattern
```typescript
interface MousePosition {
  x: number;
  y: number;
}

interface MouseTrackerProps {
  render: (position: MousePosition) => React.ReactElement;
}

const MouseTracker: React.FC<MouseTrackerProps> = ({ render }) => {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return render(position);
};

// Usage
<MouseTracker
  render={({ x, y }) => (
    <div>Mouse position: {x}, {y}</div>
  )}
/>
```

### Higher-Order Components (HOC)
```typescript
function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    const { user, loading } = useAuth();
    
    if (loading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" />;
    
    return <Component {...props} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);
```
</react_patterns>

## API Patterns

<api_patterns>
### RESTful API Design
```typescript
// Resource-based routing
class UserController {
  // GET /users
  async index(req: Request, res: Response) {
    const { page = 1, limit = 20, sort = 'createdAt' } = req.query;
    const users = await userService.findAll({ page, limit, sort });
    res.json({
      data: users,
      meta: {
        page,
        limit,
        total: users.total
      }
    });
  }
  
  // GET /users/:id
  async show(req: Request, res: Response) {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: user });
  }
  
  // POST /users
  async create(req: Request, res: Response) {
    const validated = await userSchema.validate(req.body);
    const user = await userService.create(validated);
    res.status(201).json({ data: user });
  }
  
  // PATCH /users/:id
  async update(req: Request, res: Response) {
    const validated = await userUpdateSchema.validate(req.body);
    const user = await userService.update(req.params.id, validated);
    res.json({ data: user });
  }
  
  // DELETE /users/:id
  async destroy(req: Request, res: Response) {
    await userService.delete(req.params.id);
    res.status(204).send();
  }
}
```

### GraphQL Resolver Pattern
```typescript
const userResolvers = {
  Query: {
    user: async (_: any, { id }: { id: string }, context: Context) => {
      return context.dataSources.userAPI.getUser(id);
    },
    
    users: async (
      _: any,
      { filter, pagination }: UsersArgs,
      context: Context
    ) => {
      return context.dataSources.userAPI.getUsers(filter, pagination);
    }
  },
  
  Mutation: {
    createUser: async (
      _: any,
      { input }: { input: CreateUserInput },
      context: Context
    ) => {
      const user = await context.dataSources.userAPI.createUser(input);
      
      // Publish event for subscriptions
      context.pubsub.publish('USER_CREATED', { userCreated: user });
      
      return user;
    }
  },
  
  User: {
    // Field resolver for related data
    posts: async (user: User, _: any, context: Context) => {
      return context.dataSources.postAPI.getPostsByUserId(user.id);
    }
  },
  
  Subscription: {
    userCreated: {
      subscribe: (_: any, __: any, context: Context) => {
        return context.pubsub.asyncIterator(['USER_CREATED']);
      }
    }
  }
};
```
</api_patterns>

## Database Patterns

<database_patterns>
### Repository Pattern with Prisma
```typescript
abstract class BaseRepository<T, CreateInput, UpdateInput> {
  constructor(protected prisma: PrismaClient) {}
  
  abstract findById(id: string): Promise<T | null>;
  abstract findMany(args?: any): Promise<T[]>;
  abstract create(data: CreateInput): Promise<T>;
  abstract update(id: string, data: UpdateInput): Promise<T>;
  abstract delete(id: string): Promise<void>;
}

class UserRepository extends BaseRepository<User, CreateUserDto, UpdateUserDto> {
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });
  }
  
  async findMany(args?: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByInput;
  }): Promise<User[]> {
    return this.prisma.user.findMany({
      ...args,
      include: { profile: true }
    });
  }
  
  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        profile: {
          create: data.profile
        }
      },
      include: { profile: true }
    });
  }
  
  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { profile: true }
    });
  }
  
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
  
  // Custom methods
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
  }
}
```

### Transaction Pattern
```typescript
class OrderService {
  async createOrder(
    userId: string,
    items: OrderItem[]
  ): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify inventory
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product?.name}`);
        }
      }
      
      // 2. Create order
      const order = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          items: {
            create: items
          }
        }
      });
      
      // 3. Update inventory
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity }
          }
        });
      }
      
      // 4. Create payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: calculateTotal(items),
          status: 'PENDING'
        }
      });
      
      return order;
    });
  }
}
```
</database_patterns>

## Performance Patterns

<performance_patterns>
### Caching Strategy
```typescript
class CacheService {
  constructor(
    private redis: Redis,
    private defaultTTL: number = 3600
  ) {}
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set<T>(
    key: string,
    value: T,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  // Cache-aside pattern
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;
    
    const fresh = await factory();
    await this.set(key, fresh, ttl);
    return fresh;
  }
}

// Usage with decorators
function Cacheable(ttl: number = 3600) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cache = (this as any).cache as CacheService;
      const key = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      return cache.getOrSet(key, () => originalMethod.apply(this, args), ttl);
    };
  };
}
```

### Query Optimization
```typescript
class UserService {
  // N+1 query prevention
  async getUsersWithPosts(limit: number = 10) {
    return this.prisma.user.findMany({
      take: limit,
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: { posts: true }
        }
      }
    });
  }
  
  // Pagination with cursor
  async getPaginatedUsers(cursor?: string, limit: number = 20) {
    const users = await this.prisma.user.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    
    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, -1) : users;
    
    return {
      items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }
}
```

### Request Batching
```typescript
class DataLoader<K, V> {
  private batch: Array<{ key: K; resolve: (value: V) => void }> = [];
  private scheduled = false;
  
  constructor(
    private batchFn: (keys: K[]) => Promise<V[]>,
    private delay: number = 10
  ) {}
  
  async load(key: K): Promise<V> {
    return new Promise((resolve) => {
      this.batch.push({ key, resolve });
      
      if (!this.scheduled) {
        this.scheduled = true;
        setTimeout(() => this.flush(), this.delay);
      }
    });
  }
  
  private async flush() {
    const batch = this.batch;
    this.batch = [];
    this.scheduled = false;
    
    const keys = batch.map(item => item.key);
    const values = await this.batchFn(keys);
    
    batch.forEach((item, index) => {
      item.resolve(values[index]);
    });
  }
}

// Usage
const userLoader = new DataLoader<string, User>(
  async (ids) => {
    const users = await prisma.user.findMany({
      where: { id: { in: ids } }
    });
    return ids.map(id => users.find(u => u.id === id)!);
  }
);
```
</performance_patterns>

## Security Patterns

<security_patterns>
### Input Validation
```typescript
import { z } from 'zod';

// Define schemas
const createUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  name: z.string().min(2).max(100),
  age: z.number().int().min(13).max(120).optional(),
  role: z.enum(['user', 'admin']).default('user')
});

// Validation middleware
export const validate = <T>(schema: z.ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

// Usage
router.post('/users', validate(createUserSchema), createUser);
```

### Authentication Middleware
```typescript
interface JWTPayload {
  userId: string;
  role: string;
  exp: number;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Check if token is expired
    if (Date.now() >= payload.exp * 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    // Attach user to request
    req.user = await userService.findById(payload.userId);
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

### SQL Injection Prevention
```typescript
// Always use parameterized queries
class SafeQueryBuilder {
  // ✅ Safe - uses parameterized query
  async findUserByEmail(email: string) {
    return this.prisma.$queryRaw`
      SELECT * FROM users 
      WHERE email = ${email}
    `;
  }
  
  // ✅ Safe - uses Prisma's query builder
  async searchUsers(searchTerm: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } }
        ]
      }
    });
  }
  
  // ❌ NEVER do this - SQL injection vulnerability
  async unsafeQuery(table: string) {
    // This is an example of what NOT to do
    return this.prisma.$queryRawUnsafe(`SELECT * FROM ${table}`);
  }
}
```
</security_patterns>