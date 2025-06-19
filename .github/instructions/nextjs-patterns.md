# Next.js App Router + React 지침

## Next.js App Router 및 React 작업 시:

### Server Component (기본값)
```typescript
// Copilot, 데이터 조회 및 SEO 최적화를 위한 Server Component를 생성해주세요
export default async function PredictionGamePage({ 
  params 
}: { 
  params: { gameId: string } 
}) {
  const gameResult = await getPredictionGame(params.gameId);
  
  if (!gameResult.success) {
    throw new Error(gameResult.error.message);
  }
  
  return (
    <div className="container mx-auto p-4">
      <PredictionGameCard game={gameResult.data} />
    </div>
  );
}
```

### Client Component (필요한 경우)
```typescript
// Copilot, 상호작용 및 브라우저 API를 위한 Client Component를 생성해주세요
'use client';

export default function PredictionSubmissionForm({ 
  gameId 
}: { 
  gameId: string 
}) {
  const [prediction, setPrediction] = useState<PredictionChoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (formData: FormData) => {
    // 낙관적 업데이트를 포함한 폼 제출 로직
  };
  
  return (
    <form action={handleSubmit} className="space-y-4">
      {/* 폼 내용 */}
    </form>
  );
}
```

### App Router 파일 규칙
```typescript
// Copilot, 적절한 App Router 파일 구조를 구현해주세요

// app\predictions\[gameId]\page.tsx - 동적 라우트
export default function GameDetailPage({ params }: { params: { gameId: string } }) {}

// app\predictions\[gameId]\loading.tsx - 로딩 UI
export default function Loading() {
  return <PredictionGameSkeleton />;
}

// app\predictions\[gameId]\error.tsx - 에러 UI
'use client';
export default function Error({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void 
}) {
  return (
    <ErrorBoundary error={error} onRetry={reset} />
  );
}

// app\predictions\[gameId]\not-found.tsx - 404 UI
export default function NotFound() {
  return <GameNotFoundMessage />;
}
```

### Server Action
```typescript
// Copilot, 폼 처리 및 변형을 위한 Server Action을 생성해주세요
export async function createPredictionAction(
  gameId: string,
  formData: FormData
): Promise<ActionResult> {
  'use server';
  
  try {
    const command = CreatePredictionCommand.fromFormData(formData);
    const result = await createPredictionHandler.handle(command);
    
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    
    revalidatePath(`/predictions/${gameId}`);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: '예측 생성에 실패했습니다' };
  }
}
```

### 상태 관리를 위한 커스텀 훅
```typescript
// Copilot, 컴포넌트 상태 및 부수 효과를 위한 커스텀 훅을 생성해주세요
export function usePredictionGame(gameId: string) {
  const [game, setGame] = useState<PredictionGameDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchPredictionGame(gameId)
      .then(result => {          setGame(result.data);
        } else {
          setError(result.error.message);
        }
      })
      .finally(() => setLoading(false));
  }, [gameId]);
  
  return { game, loading, error, refetch: () => fetchPredictionGame(gameId) };
}
```

### 낙관적 업데이트
```typescript
// Copilot, 더 나은 UX를 위한 낙관적 업데이트를 구현해주세요
export function useOptimisticPredictions(initialPredictions: PredictionDto[]) {
  const [optimisticPredictions, addOptimisticPrediction] = useOptimistic(
    initialPredictions,
    (state, newPrediction: PredictionDto) => [...state, newPrediction]
  );
  
  const submitPrediction = async (predictionData: CreatePredictionData) => {
    const tempPrediction = createTempPrediction(predictionData);
    addOptimisticPrediction(tempPrediction);
    
    try {
      await submitPredictionAction(predictionData);
    } catch (error) {
      // 에러 처리 및 낙관적 업데이트 되돌리기
    }
  };
  
  return { predictions: optimisticPredictions, submitPrediction };
}
```

### Suspense 경계
```typescript
// Copilot, 더 나은 로딩 상태를 위해 Suspense를 사용해주세요
export default function PredictionGamesLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<GameListSkeleton />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
```

### 에러 경계
```typescript
// Copilot, 우아한 에러 처리를 위한 에러 경계를 구현해주세요
'use client';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class PredictionErrorBoundary extends Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {    console.error('예측 에러:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error!} 
          reset={() => this.setState({ hasError: false, error: null })} 
        />
      );
    }
    
    return this.props.children;
  }
}
```

### 로딩 상태와 함께하는 스트리밍
```typescript
// Copilot, 적절한 로딩 상태와 함께 스트리밍 UI를 구현해주세요
export default async function PredictionDashboard() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<UserStatsSkeleton />}>
        <UserStats />
      </Suspense>
      
      <Suspense fallback={<RecentPredictionsSkeleton />}>
        <RecentPredictions />
      </Suspense>
      
      <Suspense fallback={<LeaderboardSkeleton />}>
        <Leaderboard />
      </Suspense>
    </div>
  );
}
```

### 검증과 함께하는 폼 처리
```typescript
// Copilot, 적절한 검증과 에러 처리가 포함된 폼을 생성해주세요
'use client';

export default function CreateGameForm() {
  const [state, formAction] = useFormState(createGameAction, initialState);
  const [pending, startTransition] = useTransition();
  
  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData);
    });
  };
  
  return (
    <form action={handleSubmit} className="space-y-4">
      <input 
        name="title" 
        required 
        className="w-full p-2 border rounded"
        aria-invalid={state.errors?.title ? 'true' : 'false'}
      />
      {state.errors?.title && (
        <p className="text-red-500 text-sm">{state.errors.title}</p>
      )}
      
      <button 
        type="submit" 
        disabled={pending}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {pending ? '생성 중...' : '게임 생성'}
      </button>
    </form>
  );
}
```

### 데이터 조회 패턴
```typescript
// Copilot, 캐싱과 재검증을 포함한 적절한 데이터 조회를 구현해주세요
export async function getPredictionGames(
  filters?: GameFilters
): Promise<Result<PredictionGameDto[], ApplicationError>> {
  try {
    const queryResult = await gameQueryHandler.handle(
      new GetPredictionGamesQuery(filters)
    );
    
    if (!queryResult.success) {
      return { success: false, error: queryResult.error };
    }
    
    return { success: true, data: queryResult.data };
  } catch (error) {
    return { 
      success: false, 
      error: new ApplicationError('게임 조회에 실패했습니다', 'FETCH_ERROR') 
    };  }
}

// 캐싱과 함께
export const getCachedPredictionGames = cache(getPredictionGames);
```

### Route Handler (API 라우트)
```typescript
// Copilot, 적절한 에러 처리와 검증이 포함된 API 라우트를 생성해주세요
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = CreateGameSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '잘못된 입력', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const command = new CreatePredictionGameCommand(validationResult.data);
    const result = await createGameHandler.handle(command);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { data: result.data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: '내부 서버 오류' },
      { status: 500 }
    );
  }
}
```

### 라우트 보호를 위한 미들웨어
```typescript
// Copilot, 인증 및 권한 부여를 위한 미들웨어를 구현해주세요
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (token && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
};
```
