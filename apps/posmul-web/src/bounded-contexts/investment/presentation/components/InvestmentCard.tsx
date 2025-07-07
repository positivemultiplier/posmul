import React from "react";
import { Badge, Card, CardHeader, CardTitle, CardContent, CardFooter } from "../../../../shared/ui/components/base";

// 임시로 InvestmentOpportunity 타입을 정의합니다.
// 실제로는 domain/entities에서 가져와야 합니다.
type InvestmentOpportunity = {
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  riskLevel: number;
  status: string;
};

interface InvestmentCardProps {
  opportunity: InvestmentOpportunity;
}

const InvestmentCard: React.FC<InvestmentCardProps> = ({ opportunity }) => {
  const fundingProgress =
    (opportunity.currentAmount / opportunity.targetAmount) * 100;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">
            {opportunity.title}
          </CardTitle>
          <Badge
            variant={opportunity.status === "ACTIVE" ? "default" : "secondary"}
          >
            {opportunity.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">{opportunity.category}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-700 mb-4">
          {opportunity.description.substring(0, 100)}...
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${fundingProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>{fundingProgress.toFixed(2)}%</span>
          <span>{opportunity.targetAmount.toLocaleString()}원</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm">
          <strong>위험도:</strong> {opportunity.riskLevel}
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          자세히 보기
        </button>
      </CardFooter>
    </Card>
  );
};

export default InvestmentCard;
