using System;
using System.Collections.Generic;
using System.Data;
using www.Models.Data.Common;

namespace www.Models.Data.Logic
{
    public abstract class ParserDataRaw<T> : ParserDataRaw
    {
        public IEnumerable<T> ApplyRules()
        {
            return ApplyRulesInternal(null);
        }
        public IEnumerable<T> ApplyRules(string ruleCode)
        {
            return ApplyRulesInternal(ruleCode);
        }

        protected abstract IEnumerable<T> ApplyRulesInternal(string rules);

        protected ParserDataRaw(DataTable data) : base(data)
        {
        }

        protected abstract InputDataKindType MyInputDataKindType { get; }
    }

    public abstract class ParserDataRaw
    {
        protected DataTable _data;

        protected ParserDataRaw(DataTable data)
        {
            _data = data;
        }

        /// <summary>
        /// Получает требуемый парсер на основе анализа набора данных
        /// </summary>
        /// <param name="data"></param>
        /// <param name="vType"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentOutOfRangeException">Осуществляется поддержка графиков и облака тегов .</exception>
        public static ParserDataRaw GetInstance(DataTable data, VisualizatonType vType)
        {
            switch (vType)
            {
                case VisualizatonType.WidgetGraph:
                    if (data.DataSet.Tables[0].Columns.Count == 3) return new ParserDataRawGraphCd1(data);
                    if (data.DataSet.Tables[0].Columns.Count >= 4) return new ParserDataRawGraphCd2(data);
                    break;
                case VisualizatonType.WidgetCloud:
                    return new ParserDataRawCloud(data);
            }

            throw new ArgumentOutOfRangeException(nameof(data), data, null);
        }
    }
}